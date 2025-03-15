import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedUrl } from "@/lib/cloudinary"

// GET /api/user/documents/business/[id]/download
// Generate a download URL for a business document
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    const documentId = params.id

    // Check if document exists and user has access to it
    const documentSharing = await prisma.documentSharing.findFirst({
      where: {
        documentId,
        sharedWithEmail: userEmail,
      },
      include: {
        document: true,
      },
    })

    if (!documentSharing) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    const document = documentSharing.document

    // Generate a signed URL for download (valid for 1 hour)
    const downloadUrl = getSignedUrl(document.fileUrl, 3600)

    // Record download activity
    await prisma.documentActivity.create({
      data: {
        action: "DOWNLOAD",
        documentId: document.id,
        userId,
        businessId: document.businessId,
        details: `Downloaded by ${userEmail}`,
      },
    })

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: document.name,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }
}

