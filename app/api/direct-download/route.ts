import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document ID and filename from query parameters
    const documentId = request.nextUrl.searchParams.get("documentId")
    const filename = request.nextUrl.searchParams.get("filename")

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId parameter" }, { status: 400 })
    }

    console.log(`Direct download requested for document: ${documentId}`)

    // Get the document from the database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log(`Document found: ${document.name}, fileUrl: ${document.fileUrl}`)

    if (!document.fileUrl) {
      return NextResponse.json({ error: "Document has no associated file" }, { status: 404 })
    }

    // Check if this is a Cloudinary URL
    if (document.fileUrl.includes("cloudinary.com")) {
      // Redirect to the Cloudinary direct download endpoint
      const redirectUrl = `/api/cloudinary-direct?documentId=${documentId}&filename=${encodeURIComponent(
        filename || document.name.split("|")[0].trim(),
      )}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // For non-Cloudinary URLs, fetch the file
    const response = await fetch(document.fileUrl, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        {
          error: "Failed to fetch file",
          status: response.status,
          statusText: response.statusText,
          url: document.fileUrl,
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

    // Extract filename and content type
    let finalFilename
    if (filename) {
      finalFilename = filename
    } else {
      // Use the document name as the filename
      const displayName = document.name.split("|")[0].trim()

      // Try to get extension from URL
      const urlObj = new URL(document.fileUrl)
      const pathSegments = urlObj.pathname.split("/")
      const filenameWithParams = pathSegments[pathSegments.length - 1]
      const originalFilename = filenameWithParams.split("?")[0]
      const extension = originalFilename.split(".").pop()?.toLowerCase() || ""

      finalFilename = `${displayName}${extension ? `.${extension}` : ""}`
    }

    // Determine content type based on filename extension
    const extension = finalFilename.split(".").pop()?.toLowerCase() || ""
    const contentType = getContentType(extension)

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

