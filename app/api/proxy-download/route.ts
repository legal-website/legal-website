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
      // For Cloudinary URLs, we need to handle PDFs differently
      const isPdf = url.toLowerCase().endsWith(".pdf") || contentType === "application/pdf"

      try {
        // Extract public ID from Cloudinary URL - this is a more robust method
        const publicId = extractPublicIdFromCloudinaryUrl(url)

        if (!publicId) {
          console.error("Could not extract public ID from Cloudinary URL:", url)
          return NextResponse.json({ error: "Invalid Cloudinary URL format" }, { status: 400 })
        }

        console.log(`Extracted Cloudinary public ID: ${publicId}`)

        // Determine resource type based on URL or content type
        let resourceType = "image"
        if (isPdf || url.includes("/raw/")) {
          resourceType = "raw"
        } else if (url.includes("/video/")) {
          resourceType = "video"
        }

        console.log(`Using resource type: ${resourceType} for Cloudinary URL`)

        // Generate a fresh signed URL with authentication
        const signedUrl = cloudinary.url(publicId, {
          secure: true,
          resource_type: resourceType,
          type: "upload",
          sign_url: true,
          attachment: true, // Force download
          expires_at: Math.floor(Date.now() / 1000) + 3600, // URL valid for 1 hour
        })

        console.log(`Generated signed Cloudinary URL: ${signedUrl}`)

        // Fetch using the signed URL
        response = await fetch(signedUrl, {
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (!response.ok) {
          console.error(`Failed to fetch with signed URL: ${response.status} ${response.statusText}`)

          // Try with a different resource type if the first attempt failed
          if (resourceType === "image" && (response.status === 401 || response.status === 404)) {
            console.log("Retrying with resource_type=raw")
            const alternativeSignedUrl = cloudinary.url(publicId, {
              secure: true,
              resource_type: "raw", // Try raw instead
              type: "upload",
              sign_url: true,
              attachment: true,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            })

            response = await fetch(alternativeSignedUrl, {
              headers: {
                Accept: "*/*",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
            })

            if (!response.ok) {
              console.error(`Failed with raw resource type too: ${response.status} ${response.statusText}`)
            }
          }
        }
      } catch (cloudinaryError) {
        console.error("Error generating Cloudinary signed URL:", cloudinaryError)

        // Fallback to direct fetch if signing fails
        response = await fetch(url, {
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })
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

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)

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
          status: response.status,
          statusText: response.statusText,
          url: isCloudinaryUrl ? "Cloudinary URL (signed)" : url,
        },
        { status: response.status },
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

// Improved helper function to extract public ID from Cloudinary URL
function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  try {
    // Parse the URL
    const parsedUrl = new URL(url)

    // Get the pathname
    const pathname = parsedUrl.pathname

    // Different patterns for different resource types
    const imageMatch = pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)/)
    const videoMatch = pathname.match(/\/video\/upload\/(?:v\d+\/)?(.+)/)
    const rawMatch = pathname.match(/\/raw\/upload\/(?:v\d+\/)?(.+)/)

    const match = imageMatch || videoMatch || rawMatch

    if (match && match[1]) {
      // Remove file extension if present
      let publicId = match[1]
      const extensionIndex = publicId.lastIndexOf(".")

      if (extensionIndex !== -1) {
        publicId = publicId.substring(0, extensionIndex)
      }

      return publicId
    }

    // If no match found with specific patterns, try a more generic approach
    const genericMatch = pathname.match(/\/upload\/(?:v\d+\/)?(.+)/)

    if (genericMatch && genericMatch[1]) {
      let publicId = genericMatch[1]
      const extensionIndex = publicId.lastIndexOf(".")

      if (extensionIndex !== -1) {
        publicId = publicId.substring(0, extensionIndex)
      }

      return publicId
    }

    return null
  } catch (error) {
    console.error("Error extracting public ID:", error)
    return null
  }
}

// Fallback function to fetch template directly from database
async function fetchTemplateDirectly(templateId: string) {
  try {
    const { default: prisma } = await import("@/lib/prisma")

    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template || !template.fileUrl) {
      return null
    }

    // Try to fetch the file directly from the database URL
    const response = await fetch(template.fileUrl, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()

    // Extract filename and content type
    const urlObj = new URL(template.fileUrl)
    const pathSegments = urlObj.pathname.split("/")
    const filenameWithParams = pathSegments[pathSegments.length - 1]
    const filename = filenameWithParams.split("?")[0]

    // Determine content type
    const extension = filename.split(".").pop()?.toLowerCase() || ""
    const contentType = getContentType(extension)

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

