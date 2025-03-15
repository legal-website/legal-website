import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedUrl } from "@/lib/cloudinary"

// GET /api/user/documents/business/[id]/download
// Get a signed download URL for a document
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email
    const documentId = params.id

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document is shared with this user
    const isSharedWithUser = await prisma.documentSharing.findFirst({
      where: {
        documentId,
        sharedWithEmail: userEmail,
      },
    })

    if (!isSharedWithUser) {
      return NextResponse.json({ error: "You don't have access to this document" }, { status: 403 })
    }

    // Generate a signed URL for download (valid for 1 hour)
    const downloadUrl = await getSignedUrl(document.fileUrl, 3600)

    // Create activity record
    await prisma.documentActivity.create({
      data: {
        action: "DOWNLOAD",
        documentId,
        userId,
        businessId: document.businessId,
        details: `Downloaded by ${userEmail}`,
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

