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

    // Determine filename with extension
    let filename = document.name
    if (document.type && !filename.toLowerCase().endsWith(`.${document.type.toLowerCase()}`)) {
      filename = `${filename}.${document.type.toLowerCase()}`
    }

    // Fetch the file directly from Cloudinary
    try {
      // Fetch the file from Cloudinary
      const response = await fetch(document.fileUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file from Cloudinary: ${response.status} ${response.statusText}`)
      }

      // Get the file content as a buffer
      const fileBuffer = await response.arrayBuffer()

      // Determine content type based on document type
      let contentType = "application/octet-stream" // Default
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
      console.error("Error fetching file from Cloudinary:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch document from storage",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      {
        error: "Failed to download document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

