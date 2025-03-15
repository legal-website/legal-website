import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

    // Ensure fileUrl exists
    if (!document.fileUrl) {
      return NextResponse.json({ error: "Document has no file URL" }, { status: 400 })
    }

    // Determine filename with extension
    let filename = document.name
    if (document.type && !filename.toLowerCase().endsWith(`.${document.type.toLowerCase()}`)) {
      filename = `${filename}.${document.type.toLowerCase()}`
    }

    // Sanitize the filename to ensure it's valid for downloads
    filename = filename.replace(/[/\\?%*:|"<>]/g, "-")

    // Check if the URL is valid
    const fileUrl = document.fileUrl
    try {
      // Test if the URL is valid
      new URL(fileUrl)
    } catch (e) {
      console.error("Invalid URL format:", fileUrl)
      return NextResponse.json({ error: "Invalid document URL format" }, { status: 400 })
    }

    // Try to fetch the file directly
    try {
      console.log("Attempting to fetch file from:", fileUrl)

      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(fileUrl, {
        headers: {
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0 NextJS Server",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Fetch failed with status: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      // Get content type from response or infer from file extension
      let contentType = response.headers.get("content-type") || "application/octet-stream"
      if (contentType === "application/octet-stream" || contentType === "text/html") {
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

      // Get the file content as an array buffer
      const arrayBuffer = await response.arrayBuffer()

      // Check if we got HTML instead of the expected file
      const text = await response.clone().text()
      if (text.includes("<html") || text.includes("<!DOCTYPE html")) {
        console.error("Received HTML instead of file content")
        throw new Error("Received HTML instead of file content")
      }

      console.log(`Successfully fetched file, size: ${arrayBuffer.byteLength} bytes, content type: ${contentType}`)

      // Create headers for the response
      const headers = new Headers()
      headers.set("Content-Type", contentType)
      headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`)
      headers.set("Content-Length", arrayBuffer.byteLength.toString())

      // Return the file as a blob with appropriate headers
      // Fix: Convert ArrayBuffer to Uint8Array which is accepted by Response
      return new Response(new Uint8Array(arrayBuffer), {
        headers,
        status: 200,
      })
    } catch (fetchError) {
      console.error("Error with direct fetch:", fetchError)

      // Try to use a proxy service or alternative method
      // For now, return a JSON response with the error and the original URL
      return NextResponse.json(
        {
          success: false,
          error: "Server-side download failed",
          fallbackUrl: fileUrl,
          filename: filename,
          message: "The file could not be downloaded directly. Please try the fallback link.",
        },
        { status: 200 },
      ) // Return 200 so client can try fallback
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

