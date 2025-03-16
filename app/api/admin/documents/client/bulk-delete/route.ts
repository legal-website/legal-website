import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

type DocumentWithIdAndBusiness = {
  id: string
  businessId: string
}

// POST /api/admin/documents/client/bulk-delete
// Delete multiple documents at once (admin access)
export async function POST(req: NextRequest) {
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

    // Get document IDs from request body
    const { documentIds } = await req.json()

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 })
    }

    // Get the documents to verify they exist and to log activity
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, businessId: true },
    })

    if (documents.length === 0) {
      return NextResponse.json({ error: "No documents found with the provided IDs" }, { status: 404 })
    }

    // Create activity records for each document
    const activityRecords = documents.map((doc: DocumentWithIdAndBusiness) => ({
      action: "DELETE",
      documentId: doc.id,
      userId: user.id,
      businessId: doc.businessId,
      details: "Deleted by admin (bulk delete)",
    }))

    // Create all activity records
    await prisma.documentActivity.createMany({
      data: activityRecords,
    })

    // Delete all documents
    const deleteResult = await prisma.document.deleteMany({
      where: { id: { in: documentIds } },
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    })
  } catch (error) {
    console.error("Error deleting documents:", error)
    return NextResponse.json(
      {
        error: "Failed to delete documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

