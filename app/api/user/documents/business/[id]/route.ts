import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary"

interface DocumentType {
  id: string
  name: string
  description?: string | null
  category: string
  type: string
  size: string
  fileUrl: string
  isPermanent: boolean
  businessId: string
  uploadedById: string
  createdAt: Date
  updatedAt: Date
  business?: {
    name: string
  } | null
}

// DELETE /api/user/documents/business/[id]
// Delete a business document
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if document is permanent
    if (document.isPermanent) {
      return NextResponse.json({ error: "This document is marked as permanent and cannot be deleted" }, { status: 400 })
    }

    // Delete document from Cloudinary
    const publicId = extractPublicId(document.fileUrl)
    if (publicId) {
      await deleteFromCloudinary(publicId)
    }

    // Delete document sharing records
    await prisma.documentSharing.deleteMany({
      where: { documentId },
    })

    // Delete document activities
    await prisma.documentActivity.deleteMany({
      where: { documentId },
    })

    // Delete document
    await prisma.document.delete({
      where: { id: documentId },
    })

    // Update storage usage
    const storage = await prisma.businessStorage.findFirst({
      where: { businessId: document.businessId },
    })

    if (storage) {
      const fileSize = Number.parseInt(document.size)
      const newStorageUsed = Math.max(0, storage.totalStorageBytes - fileSize)

      await prisma.businessStorage.update({
        where: { id: storage.id },
        data: {
          totalStorageBytes: newStorageUsed,
        },
      })
    }

    // Create activity record for deletion
    await prisma.documentActivity.create({
      data: {
        action: "DELETE",
        userId,
        businessId: document.businessId,
        details: document.name,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}

