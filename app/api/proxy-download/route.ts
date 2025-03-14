import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL and content type from query parameters
    const url = request.nextUrl.searchParams.get("url")
    const contentType = request.nextUrl.searchParams.get("contentType") || "application/octet-stream"
    const templateId = request.nextUrl.searchParams.get("templateId")
    const filename = request.nextUrl.searchParams.get("filename")

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
    }

    console.log(`Proxying download for: ${url} (${contentType})`)

    // Check if this is a Cloudinary URL
    const isCloudinaryUrl = url.includes("cloudinary.com")

    let response

    if (isCloudinaryUrl) {
      // For Cloudinary URLs, we'll try multiple approaches
      console.log("Detected Cloudinary URL, attempting multiple download methods")

      // Try direct download first (simplest approach)
      try {
        console.log("Method 1: Direct fetch from original URL")
        response = await fetch(url, {
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (response.ok) {
          console.log("Direct fetch successful")
        } else {
          console.log(`Direct fetch failed: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error("Error with direct fetch:", error)
      }

      // If direct fetch failed, try with fl_attachment parameter
      if (!response || !response.ok) {
        try {
          const attachmentUrl = url.includes("?") ? `${url}&fl_attachment=true` : `${url}?fl_attachment=true`

          console.log("Method 2: Using fl_attachment parameter:", attachmentUrl)
          response = await fetch(attachmentUrl, {
            headers: {
              Accept: "*/*",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          })

          if (response.ok) {
            console.log("fl_attachment fetch successful")
          } else {
            console.log(`fl_attachment fetch failed: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error("Error with fl_attachment fetch:", error)
        }
      }

      // If still failed, try with signed URL
      if (!response || !response.ok) {
        try {
          // Extract details from the URL for signing
          console.log("Method 3: Generating signed URL")

          // Parse the URL to extract components
          const parsedUrl = new URL(url)
          const pathParts = parsedUrl.pathname.split("/")

          // Find the upload part index
          const uploadIndex = pathParts.findIndex((part) => part === "upload")
          if (uploadIndex === -1) {
            throw new Error("Could not find 'upload' in URL path")
          }

          // Determine resource type
          let resourceType = "image"
          if (pathParts.includes("raw")) {
            resourceType = "raw"
          } else if (pathParts.includes("video")) {
            resourceType = "video"
          } else if (contentType === "application/pdf" || url.toLowerCase().endsWith(".pdf")) {
            resourceType = "raw" // PDFs should use raw
          }

          // Extract the public ID including folder structure
          // Skip the parts before and including 'upload', and any version number (v1234567890)
          const relevantParts = pathParts.slice(uploadIndex + 1).filter((part) => !part.match(/^v\d+$/))
          let publicId = relevantParts.join("/")

          // Remove file extension if present
          if (publicId.includes(".")) {
            publicId = publicId.substring(0, publicId.lastIndexOf("."))
          }

          console.log(`Extracted public ID: ${publicId}, resource type: ${resourceType}`)

          // Generate signed URL
          const signedUrl = cloudinary.url(publicId, {
            secure: true,
            resource_type: resourceType,
            type: "upload",
            sign_url: true,
            attachment: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          })

          console.log(`Generated signed URL: ${signedUrl}`)

          response = await fetch(signedUrl, {
            headers: {
              Accept: "*/*",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          })

          if (response.ok) {
            console.log("Signed URL fetch successful")
          } else {
            console.log(`Signed URL fetch failed: ${response.status} ${response.statusText}`)

            // If failed with one resource type, try with another
            if (resourceType !== "raw") {
              console.log("Retrying with resource_type=raw")
              const rawSignedUrl = cloudinary.url(publicId, {
                secure: true,
                resource_type: "raw",
                type: "upload",
                sign_url: true,
                attachment: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              })

              response = await fetch(rawSignedUrl, {
                headers: {
                  Accept: "*/*",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                },
              })

              if (response.ok) {
                console.log("Raw resource type fetch successful")
              } else {
                console.log(`Raw resource type fetch failed: ${response.status} ${response.statusText}`)
              }
            }
          }
        } catch (error) {
          console.error("Error with signed URL:", error)
        }
      }

      // If all Cloudinary methods failed, try fetching from the database
      if (!response || !response.ok) {
        console.log("All Cloudinary methods failed, trying database fallback")
        if (templateId) {
          const dbResponse = await fetchTemplateDirectly(templateId)
          if (dbResponse) {
            return dbResponse
          }
        }
      }
    } else {
      // For non-Cloudinary URLs, fetch directly
      response = await fetch(url, {
        headers: {
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
    }

    // If we still don't have a valid response
    if (!response || !response.ok) {
      console.error(`Failed to fetch file: ${response?.status} ${response?.statusText}`)

      // If we have a template ID, try to fetch directly from the database
      if (templateId) {
        const fallbackResponse = await fetchTemplateDirectly(templateId)
        if (fallbackResponse) {
          return fallbackResponse
        }
      }

      return NextResponse.json(
        {
          error: "Failed to fetch file",
          status: response?.status || 404,
          statusText: response?.statusText || "Not Found",
          url: isCloudinaryUrl ? "Cloudinary URL (signed)" : url,
        },
        { status: response?.status || 404 },
      )
    }

    // Get the file as an array buffer
    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      console.error("Downloaded file has zero bytes")
      return NextResponse.json({ error: "Downloaded file is empty" }, { status: 500 })
    }

    // Extract filename from URL or use provided filename
    let finalFilename
    if (filename) {
      finalFilename = filename
    } else {
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split("/")
      const filenameWithParams = pathSegments[pathSegments.length - 1]
      finalFilename = filenameWithParams.split("?")[0]
    }

    // Create response with appropriate headers
    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", `attachment; filename="${finalFilename}"`)
    headers.set("Content-Length", arrayBuffer.byteLength.toString())
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error in proxy download:", error)
    return NextResponse.json(
      {
        error: "Failed to proxy download",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Fallback function to fetch template directly from database
async function fetchTemplateDirectly(templateId: string) {
  try {
    const { default: prisma } = await import("@/lib/prisma")

    console.log(`Fetching template directly from database: ${templateId}`)

    // Get the template from the database
    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      console.log("Template not found in database")
      return null
    }

    console.log(`Found template in database: ${template.name}`)

    // Check if the template has a fileUrl
    if (!template.fileUrl) {
      console.log("Template has no fileUrl")
      return null
    }

    // Try to fetch the file
    console.log(`Fetching file from template fileUrl: ${template.fileUrl}`)

    // Try to fetch the file
    const response = await fetch(template.fileUrl, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.log(`Failed to fetch from template fileUrl: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()

    // Extract filename and content type
    const displayName = template.name.split("|")[0].trim()
    const urlObj = new URL(template.fileUrl)
    const pathSegments = urlObj.pathname.split("/")
    const filenameWithParams = pathSegments[pathSegments.length - 1]
    const originalFilename = filenameWithParams.split("?")[0]

    // Get extension from original filename
    const extension = originalFilename.split(".").pop()?.toLowerCase() || ""
    const contentType = getContentType(extension)

    // Create a filename with the display name and original extension
    const filename = `${displayName}${extension ? `.${extension}` : ""}`

    // Create response with appropriate headers
    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", `attachment; filename="${filename}"`)
    headers.set("Content-Length", arrayBuffer.byteLength.toString())
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error in fallback template fetch:", error)
    return null
  }
}

// Helper function to determine content type based on file extension
function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "pdf":
      return "application/pdf"
    case "doc":
      return "application/msword"
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case "xls":
      return "application/vnd.ms-excel"
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case "ppt":
      return "application/vnd.ms-powerpoint"
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "txt":
      return "text/plain"
    case "rtf":
      return "application/rtf"
    case "zip":
      return "application/zip"
    case "csv":
      return "text/csv"
    default:
      return "application/octet-stream" // Default binary file type
  }
}

