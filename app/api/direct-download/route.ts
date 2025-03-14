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

    // Get document ID and filename from query parameters
    const documentId = request.nextUrl.searchParams.get("documentId")
    const filename = request.nextUrl.searchParams.get("filename") || "document.pdf"

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId parameter" }, { status: 400 })
    }

    console.log(`Direct download requested for document: ${documentId}`)

    // Get the document from the database
    const { default: prisma } = await import("@/lib/prisma")

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    })

    if (!document || !document.fileUrl) {
      return NextResponse.json({ error: "Document not found or has no file URL" }, { status: 404 })
    }

    const fileUrl = document.fileUrl
    console.log(`Found document with URL: ${fileUrl}`)

    // Check if this is a Cloudinary URL
    const isCloudinaryUrl = fileUrl.includes("cloudinary.com")
    let fetchUrl = fileUrl

    if (isCloudinaryUrl) {
      // Extract public ID from Cloudinary URL
      const publicId = extractPublicIdFromCloudinaryUrl(fileUrl)

      if (!publicId) {
        console.error("Could not extract public ID from Cloudinary URL:", fileUrl)
        return NextResponse.json({ error: "Invalid Cloudinary URL format" }, { status: 400 })
      }

      console.log(`Extracted Cloudinary public ID: ${publicId}`)

      // Determine resource type based on URL or file extension
      let resourceType = "image"
      if (fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.includes("/raw/")) {
        resourceType = "raw"
      } else if (fileUrl.includes("/video/")) {
        resourceType = "video"
      }

      console.log(`Using resource type: ${resourceType} for Cloudinary URL`)

      // Generate a fresh signed URL with authentication
      fetchUrl = cloudinary.url(publicId, {
        secure: true,
        resource_type: resourceType,
        type: "upload",
        sign_url: true,
        attachment: true, // Force download
        expires_at: Math.floor(Date.now() / 1000) + 3600, // URL valid for 1 hour
      })

      console.log(`Generated signed Cloudinary URL: ${fetchUrl}`)
    }

    // Fetch the file
    const response = await fetch(fetchUrl, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)

      // If the first attempt failed and it's a Cloudinary URL, try with a different resource type
      if (isCloudinaryUrl && (response.status === 401 || response.status === 404)) {
        const publicId = extractPublicIdFromCloudinaryUrl(fileUrl)

        if (publicId) {
          console.log("Retrying with alternative resource type")

          // Try the opposite resource type
          const alternativeResourceType = fetchUrl.includes("resource_type=raw") ? "image" : "raw"

          const alternativeUrl = cloudinary.url(publicId, {
            secure: true,
            resource_type: alternativeResourceType,
            type: "upload",
            sign_url: true,
            attachment: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          })

          const alternativeResponse = await fetch(alternativeUrl, {
            headers: {
              Accept: "*/*",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          })

          if (alternativeResponse.ok) {
            console.log(`Success with alternative resource type: ${alternativeResourceType}`)
            return streamResponse(alternativeResponse, filename)
          }
        }
      }

      return NextResponse.json(
        {
          error: "Failed to fetch file",
          status: response.status,
          statusText: response.statusText,
          url: isCloudinaryUrl ? "Cloudinary URL (signed)" : fileUrl,
        },
        { status: response.status },
      )
    }

    return streamResponse(response, filename)
  } catch (error) {
    console.error("Error in direct download:", error)
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to stream the response
async function streamResponse(response: Response, filename: string) {
  const arrayBuffer = await response.arrayBuffer()

  if (arrayBuffer.byteLength === 0) {
    console.error("Downloaded file has zero bytes")
    return NextResponse.json({ error: "Downloaded file is empty" }, { status: 500 })
  }

  // Determine content type based on filename
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

