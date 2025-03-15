import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedDownloadUrl } from "@/lib/cloudinary"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Starting document download process for ID:", params.id)

    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const documentId = params.id

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user?.business) {
      return NextResponse.json({ error: "User has no business associated" }, { status: 403 })
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document belongs to user's business
    if (document.businessId !== user.business.id) {
      return NextResponse.json({ error: "Access denied to this document" }, { status: 403 })
    }

    console.log("Document found:", {
      id: document.id,
      name: document.name,
      type: document.type,
      fileUrl: document.fileUrl,
    })

    // Determine filename with extension
    let filename = document.name
    if (document.type && !filename.toLowerCase().endsWith(`.${document.type.toLowerCase()}`)) {
      filename = `${filename}.${document.type.toLowerCase()}`
    }

    // Try to extract the public ID from the URL
    const urlParts = document.fileUrl.split("/")
    const publicIdWithExtension = urlParts[urlParts.length - 1].split("?")[0]
    const publicId = publicIdWithExtension.split(".")[0]

    console.log("Extracted public ID:", publicId)

    try {
      // APPROACH 1: Use Cloudinary's delivery API directly with authentication
      // Generate a signed URL with the Cloudinary SDK
      const downloadUrl = getSignedDownloadUrl(document.fileUrl, filename, 3600)
      console.log("Generated download URL:", downloadUrl)

      // Redirect to the signed URL
      return NextResponse.redirect(downloadUrl)
    } catch (cloudinaryError) {
      console.error("Error with Cloudinary signed URL:", cloudinaryError)

      // APPROACH 2: Fallback to direct fetch and stream
      try {
        console.log("Falling back to direct fetch from:", document.fileUrl)
        const response = await fetch(document.fileUrl, {
          headers: {
            Accept: "*/*",
            "User-Agent": "NextJS Server",
          },
        })

        if (!response.ok) {
          console.error(`Fetch failed with status: ${response.status} ${response.statusText}`)
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }

        // Get content type from response or infer from file extension
        let contentType = response.headers.get("content-type") || "application/octet-stream"
        if (contentType === "application/octet-stream" && document.type) {
          // Try to infer a better content type
          switch (document.type.toLowerCase()) {
            case "pdf":
              contentType = "application/pdf"
              break
            case "doc":
            case "docx":
              contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              break
            case "xls":
            case "xlsx":
              contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              break
            case "jpg":
            case "jpeg":
              contentType = "image/jpeg"
              break
            case "png":
              contentType = "image/png"
              break
            case "txt":
              contentType = "text/plain"
              break
          }
        }

        // Get the file content
        const fileBuffer = await response.arrayBuffer()
        console.log(`Successfully fetched file, size: ${fileBuffer.byteLength} bytes`)

        // Create headers for the response
        const headers = new Headers()
        headers.set("Content-Type", contentType)
        headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`)
        headers.set("Content-Length", fileBuffer.byteLength.toString())

        // Return the file as a blob with appropriate headers
        return new Response(fileBuffer, {
          headers,
          status: 200,
        })
      } catch (fetchError) {
        console.error("Error with direct fetch:", fetchError)

        // APPROACH 3: Last resort - return JSON with the URL for client-side handling
        return NextResponse.json(
          {
            success: false,
            error: "Server-side download failed",
            fallbackUrl: document.fileUrl,
            filename: filename,
          },
          { status: 200 },
        ) // Return 200 so client can try fallback
      }
    }
  } catch (error) {
    console.error("Error in download route:", error)
    return NextResponse.json(
      {
        error: "Failed to download document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

