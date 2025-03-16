import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

type DocumentWithIdAndBusiness = {
  id: string
  businessId: string | null // Make businessId nullable since it might be null
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
    const body = await req.json()
    const { documentIds } = body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 })
    }

    console.log("Deleting documents with IDs:", documentIds)

    // Get the documents to verify they exist and to log activity
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, businessId: true },
    })

    if (documents.length === 0) {
      return NextResponse.json({ error: "No documents found with the provided IDs" }, { status: 404 })
    }

    console.log("Found documents to delete:", documents.length)

    try {
      // Create activity records for each document
      for (const doc of documents) {
        await prisma.documentActivity.create({
          data: {
            action: "DELETE",
            documentId: doc.id,
            userId: user.id,
            businessId: doc.businessId || undefined,
            details: "Deleted by admin (bulk delete)",
          },
        })
      }

      // Delete all documents
      const deleteResult = await prisma.document.deleteMany({
        where: { id: { in: documentIds } },
      })

      console.log("Delete result:", deleteResult)

      return NextResponse.json({
        success: true,
        deletedCount: deleteResult.count,
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
    console.error("Error in bulk delete route:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

