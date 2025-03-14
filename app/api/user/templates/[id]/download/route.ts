import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSignedUrl } from "@/lib/cloudinary"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Fetch template details from your database
    // This is a placeholder - replace with your actual database query
    // const template = await prisma.document.findUnique({
    //   where: { id: templateId },
    // });

    // For testing, we'll use a mock template
    const template = {
      id: templateId,
      name: "Template Document",
      fileUrl: request.nextUrl.searchParams.get("fileUrl") || "https://res.cloudinary.com/demo/raw/upload/sample.pdf",
      contentType: "application/pdf",
    }

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user has access to this template
    // This is a placeholder - replace with your actual access check
    // const hasAccess = await checkUserAccess(session.user.id, templateId);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }

    if (!template.fileUrl) {
      return NextResponse.json({ error: "No file URL available for this template" }, { status: 404 })
    }

    // Generate a signed URL if it's a Cloudinary URL
    let downloadUrl = template.fileUrl
    if (template.fileUrl.includes("cloudinary.com")) {
      try {
        downloadUrl = await getSignedUrl(template.fileUrl, 3600)
      } catch (error) {
        console.error("Error generating signed URL:", error)
      }
    }

    // Get file extension
    const urlWithoutParams = template.fileUrl.split("?")[0]
    const urlParts = urlWithoutParams.split(".")
    const fileExtension = urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : ""

    // Determine content type
    let contentType = template.contentType || "application/octet-stream"
    if (!contentType || contentType === "application/octet-stream") {
      switch (fileExtension) {
        case "pdf":
          contentType = "application/pdf"
          break
        case "doc":
          contentType = "application/msword"
          break
        case "docx":
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          break
        case "xls":
          contentType = "application/vnd.ms-excel"
          break
        case "xlsx":
          contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          break
        // Add more content types as needed
      }
    }

    // Log the download (optional)
    // await prisma.documentDownload.create({
    //   data: {
    //     documentId: templateId,
    //     userId: session.user.id,
    //   },
    // });

    // Return the download URL and metadata
    return NextResponse.json({
      fileUrl: downloadUrl,
      name: template.name,
      contentType: contentType,
      fileExtension: fileExtension,
    })
  } catch (error) {
    console.error("Error in template download route:", error)
    return NextResponse.json({ error: "Failed to process download request" }, { status: 500 })
  }
}

