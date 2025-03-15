import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// DELETE /api/admin/documents/client/[id]
// Delete a client document
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Create activity record for deletion
    await prisma.documentActivity.create({
      data: {
        action: "DELETE",
        userId: user.id,
        businessId: document.businessId,
        details: `Document "${document.name}" deleted by admin`,
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

