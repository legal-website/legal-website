import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSignedUrl } from "@/lib/cloudinary"

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

    // Generate signed URL for download
    const downloadUrl = getSignedUrl(document.fileUrl, 3600) // 1 hour expiry

    console.log("Generated download URL for document:", document.id)

    return NextResponse.json({
      success: true,
      downloadUrl,
    })
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}

