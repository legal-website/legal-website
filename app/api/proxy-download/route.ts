import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSignedUrl } from "@/lib/cloudinary"

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
    let finalUrl = url

    if (isCloudinaryUrl) {
      try {
        // Try to get a direct download URL first (bypassing signing)
        const directUrl = url.replace("/upload/", "/upload/fl_attachment/")
        console.log(`Trying direct download URL: ${directUrl}`)

        response = await fetch(directUrl, {
          method: "HEAD",
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (response.ok) {
          finalUrl = directUrl
          console.log(`Direct download URL is valid, using: ${finalUrl}`)
        } else {
          // If direct URL fails, try a signed URL
          console.log(`Direct download URL failed with status ${response.status}, trying signed URL`)
          const signedUrl = await getSignedUrl(url)

          // Verify the signed URL works
          response = await fetch(signedUrl, {
            method: "HEAD",
            headers: {
              Accept: "*/*",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          })

          if (response.ok) {
            finalUrl = signedUrl
            console.log(`Signed URL is valid, using: ${finalUrl}`)
          } else {
            console.log(`Signed URL failed with status ${response.status}, falling back to original URL`)
            // Fall back to original URL
          }
        }
      } catch (error) {
        console.error("Error preparing Cloudinary URL:", error)
        // Continue with original URL if all else fails
      }
    }

    // Fetch the file using the best URL we have
    try {
      console.log(`Fetching file from: ${finalUrl}`)
      response = await fetch(finalUrl, {
        headers: {
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
    } catch (fetchError) {
      console.error(`Error fetching from ${finalUrl}:`, fetchError)

      // If we tried a modified URL and it failed, try the original as last resort
      if (finalUrl !== url) {
        console.log(`Trying original URL as fallback: ${url}`)
        response = await fetch(url, {
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })
      } else {
        throw fetchError
      }
    }

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)

      // If we have a template ID, try to fetch directly from the database
      if (templateId) {
        try {
          const { default: prisma } = await import("@/lib/prisma")

          const template = await prisma.document.findUnique({
            where: {
              id: templateId,
              type: "template",
            },
          })

          if (template && template.fileUrl && template.fileUrl !== url) {
            console.log(`Trying alternative URL from database: ${template.fileUrl}`)

            // Try the URL from the database
            const dbResponse = await fetch(template.fileUrl, {
              headers: {
                Accept: "*/*",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
            })

            if (dbResponse.ok) {
              response = dbResponse
            } else {
              console.error(`Database URL also failed: ${dbResponse.status} ${dbResponse.statusText}`)
            }
          }
        } catch (dbError) {
          console.error("Error fetching from database:", dbError)
        }
      }

      // If all attempts failed
      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Failed to fetch file",
            status: response.status,
            statusText: response.statusText,
            url: finalUrl,
          },
          { status: response.status },
        )
      }
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
      const urlObj = new URL(finalUrl)
      const pathSegments = urlObj.pathname.split("/")
      const filenameWithParams = pathSegments[pathSegments.length - 1]
      finalFilename = filenameWithParams.split("?")[0]
    }

    // Ensure filename has an extension
    if (!finalFilename.includes(".")) {
      // Try to determine extension from content type
      const extensionMap: Record<string, string> = {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "text/plain": ".txt",
        "text/csv": ".csv",
        "application/zip": ".zip",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
      }

      const extension = extensionMap[contentType] || ""
      finalFilename = `${finalFilename}${extension}`
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

