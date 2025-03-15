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

    // Generate a signed URL for download (valid for 1 hour)
    const downloadUrl = await getSignedUrl(document.fileUrl, 3600)

    // Create activity record
    await prisma.documentActivity.create({
      data: {
        action: "DOWNLOAD",
        documentId,
        userId: user.id,
        businessId: document.businessId,
        details: "Downloaded by admin",
      },
    })

    return NextResponse.json({
      success: true,
      downloadUrl,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }
}

