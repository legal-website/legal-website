import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedUrl } from "@/lib/cloudinary"

// GET /api/admin/documents/client/[id]/download
// Get a signed download URL for a document (admin access)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documentId = params.id

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if fileUrl exists
    if (!document.fileUrl) {
      return NextResponse.json({ error: "Document has no file URL" }, { status: 400 })
    }

    try {
      // Generate a signed URL for download (valid for 1 hour)
      const downloadUrl = await getSignedUrl(document.fileUrl, 3600)

      // Create activity record
      await prisma.documentActivity.create({
        data: {
          action: "DOWNLOAD",
          documentId,
          userId: user.id,
          businessId: document.businessId || undefined,
          details: "Downloaded by admin",
        },
      })

      return NextResponse.json({
        success: true,
        downloadUrl,
      })
    } catch (signedUrlError) {
      console.error("Error generating signed URL:", signedUrlError)

      // If we can't generate a signed URL, return the original URL as fallback
      return NextResponse.json({
        success: true,
        downloadUrl: document.fileUrl,
        warning: "Using direct URL as fallback",
      })
    }
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      {
        error: "Failed to generate download URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

