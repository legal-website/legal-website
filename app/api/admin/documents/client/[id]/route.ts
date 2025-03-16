import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// DELETE /api/admin/documents/client/[id]
// Delete a document (admin access)
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
    console.log("Deleting document with ID:", documentId)

    // Get the document to verify it exists and to log activity
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log("Found document to delete:", document.id)

    try {
      // Create activity record
      await prisma.documentActivity.create({
        data: {
          action: "DELETE",
          documentId,
          userId: user.id,
          businessId: document.businessId || undefined,
          details: "Deleted by admin",
        },
      })

      // Delete the document
      await prisma.document.delete({
        where: { id: documentId },
      })

      console.log("Document deleted successfully")

      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      })
    } catch (innerError) {
      console.error("Error in database operations:", innerError)
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: innerError instanceof Error ? innerError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

