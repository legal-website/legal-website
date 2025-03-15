import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// POST /api/user/documents/business/[id]/share
// Share a document with another user
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const documentId = params.id

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        business: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has access to this document
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business || user.business.id !== document.businessId) {
      return NextResponse.json({ error: "You don't have access to this document" }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()
    const { email, message } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if document is already shared with this email
    const existingShare = await prisma.documentSharing.findFirst({
      where: {
        documentId,
        sharedWithEmail: email,
      },
    })

    if (existingShare) {
      return NextResponse.json({ error: "Document already shared with this email" }, { status: 400 })
    }

    // Create document sharing record
    const sharing = await prisma.documentSharing.create({
      data: {
        documentId,
        sharedWithEmail: email,
        sharedById: userId,
      },
    })

    // Create activity record
    await prisma.documentActivity.create({
      data: {
        action: "SHARE",
        documentId,
        userId,
        businessId: document.businessId,
        details: email,
      },
    })

    // Send email notification
    const sender = user.name || user.email
    const businessName = document.business?.name || "a business"

    await sendEmail({
      to: email,
      subject: `${sender} shared a document with you`,
      html: `
        <p>Hello,</p>
        <p>${sender} has shared a document with you from ${businessName}.</p>
        <p><strong>Document:</strong> ${document.name}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
        <p>You can access this document by logging into your account.</p>
        <p>Thank you,<br>${businessName} Team</p>
      `,
    })

    return NextResponse.json({
      success: true,
      sharing: {
        id: sharing.id,
        documentId: sharing.documentId,
        sharedWithEmail: sharing.sharedWithEmail,
        createdAt: sharing.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error sharing document:", error)
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 })
  }
}

