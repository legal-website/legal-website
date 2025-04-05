import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { amendmentId: string } }) {
  console.log(`GET /api/admin/amendments/${params.amendmentId} - Start`)

  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log(`GET /api/admin/amendments/${params.amendmentId} - Unauthorized`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      console.log(`GET /api/admin/amendments/${params.amendmentId} - Forbidden`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the amendment ID from the URL
    const { amendmentId } = params

    if (!amendmentId) {
      console.log(`GET /api/admin/amendments/${params.amendmentId} - Missing amendment ID`)
      return NextResponse.json({ error: "Amendment ID is required" }, { status: 400 })
    }

    // Check if amendment exists
    console.log(`Checking if amendment ${amendmentId} exists`)
    try {
      const amendment = await db.amendment.findUnique({
        where: { id: amendmentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })

      if (!amendment) {
        console.log(`Amendment ${amendmentId} not found`)
        return NextResponse.json({ error: "Amendment not found" }, { status: 404 })
      }

      console.log(`Amendment ${amendmentId} found:`, amendment)

      // Format the response
      const formattedAmendment = {
        id: amendment.id,
        userId: amendment.userId,
        userName: amendment.user?.name || "Unknown",
        userEmail: amendment.user?.email || "unknown@example.com",
        type: amendment.type,
        details: amendment.details,
        status: amendment.status,
        createdAt: amendment.createdAt.toISOString(),
        updatedAt: amendment.updatedAt.toISOString(),
        documentUrl: amendment.documentUrl,
        receiptUrl: amendment.receiptUrl,
        paymentAmount: amendment.paymentAmount ? Number.parseFloat(amendment.paymentAmount.toString()) : null,
        notes: amendment.notes,
        statusHistory: amendment.statusHistory.map((history) => ({
          id: history.id,
          status: history.status,
          createdAt: history.createdAt.toISOString(),
          notes: history.notes,
          updatedBy: history.updatedBy,
        })),
      }

      return NextResponse.json(formattedAmendment)
    } catch (dbError) {
      console.error(`Database error when finding amendment:`, dbError)
      return NextResponse.json(
        {
          error: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`,
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error getting amendment:", error)
    return NextResponse.json(
      {
        error: "Failed to get amendment: " + (error instanceof Error ? error.message : "Unknown error"),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Add DELETE method to handle amendment deletion
export async function DELETE(request: Request, { params }: { params: { amendmentId: string } }) {
  console.log(`DELETE /api/admin/amendments/${params.amendmentId} - Start`)

  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log(`DELETE /api/admin/amendments/${params.amendmentId} - Unauthorized`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      console.log(`DELETE /api/admin/amendments/${params.amendmentId} - Forbidden`)
      return NextResponse.json({ error: "Forbidden - Only administrators can delete amendments" }, { status: 403 })
    }

    // Get the amendment ID from the URL
    const { amendmentId } = params

    if (!amendmentId) {
      console.log(`DELETE /api/admin/amendments/${params.amendmentId} - Missing amendment ID`)
      return NextResponse.json({ error: "Amendment ID is required" }, { status: 400 })
    }

    // Check if amendment exists
    console.log(`Checking if amendment ${amendmentId} exists before deletion`)
    const existingAmendment = await db.amendment.findUnique({
      where: { id: amendmentId },
    })

    if (!existingAmendment) {
      console.log(`Amendment ${amendmentId} not found for deletion`)
      return NextResponse.json({ error: "Amendment not found" }, { status: 404 })
    }

    // Since $transaction might not be available, perform operations sequentially
    try {
      // Delete related status history first using raw SQL query
      console.log(`Deleting status history for amendment ${amendmentId}`)
      await db.$executeRaw`DELETE FROM "AmendmentStatusHistory" WHERE "amendmentId" = ${amendmentId}`

      // Delete the amendment using raw SQL query
      console.log(`Deleting amendment ${amendmentId}`)
      await db.$executeRaw`DELETE FROM "Amendment" WHERE "id" = ${amendmentId}`

      console.log(`Amendment ${amendmentId} successfully deleted`)
      return NextResponse.json({ success: true, message: "Amendment successfully deleted" })
    } catch (dbError) {
      console.error(`Database error when deleting amendment:`, dbError)
      return NextResponse.json(
        {
          error: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`,
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error deleting amendment:", error)
    return NextResponse.json(
      {
        error: "Failed to delete amendment: " + (error instanceof Error ? error.message : "Unknown error"),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

