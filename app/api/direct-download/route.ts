import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedUrl, extractPublicId } from "@/lib/cloudinary"

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const url = new URL(request.url)
    const fileUrl = url.searchParams.get("url")
    const documentId = url.searchParams.get("documentId")
    const filename = url.searchParams.get("filename") || "document"

    // Check if we have a URL or document ID
    if (!fileUrl && !documentId) {
      return NextResponse.json({ error: "Missing required parameters: url or documentId" }, { status: 400 })
    }

    // Get the user session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let downloadUrl = fileUrl

    // If we have a document ID, get the file URL from the database
    if (documentId) {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
          type: "template", // Ensure it's a template
        },
        include: {
          business: true,
        },
      })

      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      // Check if the user has access to this document
      // This is a simplified check - you may need to adjust based on your access control logic
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: { business: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if user has access to this document
      // Either they belong to the same business or there's an access record
      const hasAccess =
        user.businessId === document.businessId ||
        user.role === "ADMIN" ||
        (await prisma.document.findFirst({
          where: {
            businessId: user.businessId || "",
            type: "access_template",
            name: `access_${documentId}_${user.id}`,
          },
        }))

      if (!hasAccess) {
        return NextResponse.json({ error: "You do not have access to this document" }, { status: 403 })
      }

      downloadUrl = document.fileUrl
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: "File URL not found" }, { status: 404 })
    }

    // Log the download attempt
    console.log(`Direct download attempt for: ${downloadUrl}`)

    // Check if this is a Cloudinary URL
    const publicId = extractPublicId(downloadUrl)

    if (publicId) {
      try {
        // Generate a signed URL with a short expiration
        const signedUrl = await getSignedUrl(publicId, 300) // 5 minutes

        // Redirect to the signed URL
        return NextResponse.redirect(signedUrl)
      } catch (error) {
        console.error("Error generating signed URL:", error)
        // Fall back to the original URL if we can't generate a signed URL
      }
    }

    // For non-Cloudinary URLs or if signed URL generation fails
    try {
      // Fetch the file
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      // Get the file content
      const fileContent = await response.arrayBuffer()

      // Determine content type
      const contentType = response.headers.get("content-type") || "application/octet-stream"

      // Ensure we have a proper filename with extension
      let finalFilename = filename
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
        }

        const extension = extensionMap[contentType] || ""
        finalFilename = `${filename}${extension}`
      }

      // Create a response with the file content
      const fileResponse = new NextResponse(fileContent, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${finalFilename}"`,
          "Content-Length": fileContent.byteLength.toString(),
        },
      })

      return fileResponse
    } catch (error) {
      console.error("Error fetching file:", error)
      return NextResponse.json({ error: "Failed to download file", details: (error as Error).message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in direct download:", error)
    return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 })
  }
}

