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

    // Get parameters
    const url = request.nextUrl.searchParams.get("url")
    const publicId = request.nextUrl.searchParams.get("publicId")
    const resourceType = request.nextUrl.searchParams.get("resourceType") || "image"
    const filename = request.nextUrl.searchParams.get("filename")

    if (!url && !publicId) {
      return NextResponse.json({ error: "Missing URL or publicId parameter" }, { status: 400 })
    }

    console.log(`Cloudinary download requested for ${publicId || url}`)

    // If we have a URL but no publicId, try to extract it
    let finalPublicId = publicId
    let finalResourceType = resourceType

    if (!finalPublicId && url) {
      try {
        // Parse the URL
        const parsedUrl = new URL(url)
        const pathParts = parsedUrl.pathname.split("/")

        // Find the upload part index
        const uploadIndex = pathParts.findIndex((part) => part === "upload")
        if (uploadIndex === -1) {
          throw new Error("Could not find 'upload' in URL path")
        }

        // Determine resource type from URL
        if (pathParts.includes("raw")) {
          finalResourceType = "raw"
        } else if (pathParts.includes("video")) {
          finalResourceType = "video"
        } else if (url.toLowerCase().endsWith(".pdf")) {
          finalResourceType = "raw" // PDFs should use raw
        }

        // Extract the public ID including folder structure
        // Skip the parts before and including 'upload', and any version number (v1234567890)
        const relevantParts = pathParts.slice(uploadIndex + 1).filter((part) => !part.match(/^v\d+$/))
        finalPublicId = relevantParts.join("/")

        // Remove file extension if present
        if (finalPublicId.includes(".")) {
          finalPublicId = finalPublicId.substring(0, finalPublicId.lastIndexOf("."))
        }

        console.log(`Extracted public ID: ${finalPublicId}, resource type: ${finalResourceType}`)
      } catch (error) {
        console.error("Error extracting public ID from URL:", error)
        return NextResponse.json({ error: "Could not extract public ID from URL" }, { status: 400 })
      }
    }

    if (!finalPublicId) {
      return NextResponse.json({ error: "Could not determine public ID" }, { status: 400 })
    }

    // Try to download the file directly from Cloudinary using the Admin API
    try {
      console.log(`Downloading from Cloudinary: ${finalResourceType}/${finalPublicId}`)

      // Use the Cloudinary Admin API to get the asset details
      const asset = await new Promise<any>((resolve, reject) => {
        cloudinary.api.resource(
          finalPublicId,
          {
            resource_type: finalResourceType,
            type: "upload",
            max_results: 1,
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

      console.log(`Asset details:`, asset)

      if (!asset || !asset.secure_url) {
        throw new Error("Could not get asset details from Cloudinary")
      }

      // Generate a signed download URL
      const downloadUrl = cloudinary.url(finalPublicId, {
        secure: true,
        resource_type: finalResourceType,
        type: "upload",
        sign_url: true,
        attachment: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      })

      console.log(`Generated download URL: ${downloadUrl}`)

      // Fetch the file
      const response = await fetch(downloadUrl, {
        headers: {
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })

      if (!response.ok) {
        console.error(`Failed to fetch from Cloudinary: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch from Cloudinary: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()

      if (arrayBuffer.byteLength === 0) {
        throw new Error("Downloaded file has zero bytes")
      }

      // Determine content type and filename
      let contentType =
        asset.resource_type === "image"
          ? asset.format
            ? `image/${asset.format}`
            : "image/jpeg"
          : "application/octet-stream"

      if (asset.resource_type === "raw") {
        // Try to determine content type from format or filename
        const format = asset.format?.toLowerCase() || ""
        if (format === "pdf") {
          contentType = "application/pdf"
        } else if (["doc", "docx"].includes(format)) {
          contentType =
            format === "doc"
              ? "application/msword"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        } else if (["xls", "xlsx"].includes(format)) {
          contentType =
            format === "xls"
              ? "application/vnd.ms-excel"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        } else if (format === "txt") {
          contentType = "text/plain"
        }
      }

      // Use provided filename or extract from asset
      let finalFilename = filename || asset.public_id.split("/").pop()

      // Add extension if missing
      if (!finalFilename.includes(".")) {
        const extension =
          asset.format ||
          (contentType === "application/pdf" ? "pdf" : contentType === "application/msword" ? "doc" : "bin")
        finalFilename = `${finalFilename}.${extension}`
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
      console.error("Error downloading from Cloudinary:", error)

      // Try one more approach - direct download with the API key and secret
      try {
        console.log("Trying direct authenticated download")

        // Generate a signed URL with authentication
        const timestamp = Math.floor(Date.now() / 1000)
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET

        if (!apiKey || !apiSecret) {
          throw new Error("Missing Cloudinary API credentials")
        }

        // Create signature
        const toSign = `public_id=${finalPublicId}&timestamp=${timestamp}${apiSecret}`
        const signature = require("crypto").createHash("sha1").update(toSign).digest("hex")

        // Construct authenticated URL
        const authUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${finalResourceType}/upload/fl_attachment,fl_force_download/v${timestamp}/${finalPublicId}?api_key=${apiKey}&timestamp=${timestamp}&signature=${signature}`

        console.log(`Generated authenticated URL: ${authUrl}`)

        // Fetch the file
        const response = await fetch(authUrl, {
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch with authenticated URL: ${response.status} ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        // Determine content type based on resource type and public ID
        let contentType = "application/octet-stream"
        if (finalResourceType === "image") {
          contentType = "image/jpeg"
        } else if (finalResourceType === "raw" && finalPublicId.toLowerCase().endsWith(".pdf")) {
          contentType = "application/pdf"
        }

        // Create a filename
        let finalFilename = filename || finalPublicId.split("/").pop() || "download"
        if (!finalFilename.includes(".")) {
          const extension = finalResourceType === "image" ? "jpg" : finalResourceType === "video" ? "mp4" : "pdf"
          finalFilename = `${finalFilename}.${extension}`
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
      } catch (directError) {
        console.error("Error with direct authenticated download:", directError)
        return NextResponse.json(
          {
            error: "Failed to download from Cloudinary",
            details: error instanceof Error ? error.message : String(error),
            directError: directError instanceof Error ? directError.message : String(directError),
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error in Cloudinary download:", error)
    return NextResponse.json(
      {
        error: "Failed to download from Cloudinary",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

