import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { extractCloudinaryDetails } from "@/lib/cloudinary"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  })

// Define valid resource types
type CloudinaryResourceType = "image" | "video" | "raw" | "auto"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parameters
    const documentId = request.nextUrl.searchParams.get("documentId")
    const url = request.nextUrl.searchParams.get("url")
    const filename = request.nextUrl.searchParams.get("filename") || "download"

    if (!documentId && !url) {
      return NextResponse.json({ error: "Missing documentId or url parameter" }, { status: 400 })
    }

    // If we have a document ID, fetch the document
    let fileUrl = url
    let documentName = filename

    if (documentId) {
      const { default: prisma } = await import("@/lib/prisma")

      const document = await prisma.document.findUnique({
        where: { id: documentId },
      })

      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      fileUrl = document.fileUrl
      documentName = document.name.split("|")[0].trim()
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL available" }, { status: 404 })
    }

    console.log(`Processing download for: ${fileUrl}`)

    // Check if this is a Cloudinary URL
    if (!fileUrl.includes("cloudinary.com")) {
      // For non-Cloudinary URLs, redirect to the proxy download
      const redirectUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Extract Cloudinary details
    const { publicId, resourceType: extractedResourceType, folderPath } = extractCloudinaryDetails(fileUrl)

    if (!publicId) {
      return NextResponse.json({ error: "Could not extract public ID from URL" }, { status: 400 })
    }

    // Ensure resourceType is one of the valid types
    const resourceType: CloudinaryResourceType = validateResourceType(extractedResourceType)

    console.log(
      `Extracted Cloudinary details - Public ID: ${publicId}, Resource Type: ${resourceType}, Folder: ${folderPath}`,
    )

    // Get file extension from URL
    const urlObj = new URL(fileUrl)
    const pathSegments = urlObj.pathname.split("/")
    const filenameWithParams = pathSegments[pathSegments.length - 1]
    const extension = filenameWithParams.split(".").pop()?.split("?")[0] || ""

    // Determine content type
    const contentType = getContentType(extension)

    // Create final filename
    const finalFilename = documentName + (extension ? `.${extension}` : "")

    // Use Cloudinary Admin API to get a temporary download URL
    try {
      // First, try to get the asset details to confirm it exists
      const assetDetails = await new Promise<any>((resolve, reject) => {
        cloudinary.api.resource(
          publicId,
          {
            resource_type: resourceType,
            type: "upload",
          },
          (error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          },
        )
      })

      console.log(`Asset details retrieved: ${assetDetails.secure_url}`)

      // Generate a signed download URL with the Admin API
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: resourceType,
        type: "upload",
        attachment: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      })

      console.log(`Generated download URL: ${downloadUrl}`)

      // Fetch the file using the signed URL
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      // Get the file as an array buffer
      const arrayBuffer = await response.arrayBuffer()

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
      console.error("Error using Cloudinary Admin API:", error)

      // Try an alternative approach - direct download using the Node.js SDK
      try {
        console.log("Trying alternative download method with Cloudinary SDK")

        // Create a temporary download URL with the Admin API
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.explicit(
            publicId,
            {
              resource_type: resourceType,
              type: "upload",
              eager: [{ fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            },
          )
        })

        if (!result || !result.secure_url) {
          throw new Error("Failed to generate download URL")
        }

        console.log(`Generated eager URL: ${result.secure_url}`)

        // Fetch the file
        const response = await fetch(result.secure_url)

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }

        // Get the file as an array buffer
        const arrayBuffer = await response.arrayBuffer()

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
      } catch (alternativeError) {
        console.error("Alternative download method failed:", alternativeError)

        // If all else fails, try to use the original URL with a direct fetch
        try {
          console.log("Trying direct fetch from original URL")

          const response = await fetch(fileUrl)

          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
          }

          // Get the file as an array buffer
          const arrayBuffer = await response.arrayBuffer()

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
        } catch (directError) {
          console.error("Direct fetch failed:", directError)
          return NextResponse.json(
            {
              error: "All download methods failed",
              details: `Original error: ${error instanceof Error ? error.message : String(error)}`,
              alternativeError: alternativeError instanceof Error ? alternativeError.message : String(alternativeError),
              directError: directError instanceof Error ? directError.message : String(directError),
            },
            { status: 500 },
          )
        }
      }
    }
  } catch (error) {
    console.error("Error in Cloudinary direct download:", error)
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to validate and convert resource type
function validateResourceType(type: string): CloudinaryResourceType {
  const validTypes: CloudinaryResourceType[] = ["image", "video", "raw", "auto"]

  // Convert to lowercase for case-insensitive comparison
  const normalizedType = type.toLowerCase()

  // Check if it's a valid type
  if (validTypes.includes(normalizedType as CloudinaryResourceType)) {
    return normalizedType as CloudinaryResourceType
  }

  // Default to "auto" if not valid
  console.warn(`Invalid resource type: ${type}, defaulting to "auto"`)
  return "auto"
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

