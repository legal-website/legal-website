import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AmendmentModel } from "@/lib/prisma-types"

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all amendments with user information
    const amendments = await db.amendment.findMany({
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
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format the amendments for the frontend
    const formattedAmendments = amendments.map((amendment: AmendmentModel) => ({
      id: amendment.id,
      userId: amendment.userId,
      userName: amendment.user.name || "Unknown",
      userEmail: amendment.user.email,
      type: amendment.type,
      details: amendment.details,
      status: amendment.status,
      createdAt: amendment.createdAt.toISOString(),
      updatedAt: amendment.updatedAt.toISOString(),
      documentUrl: amendment.documentUrl,
      receiptUrl: amendment.receiptUrl,
      paymentAmount: amendment.paymentAmount ? Number.parseFloat(amendment.paymentAmount.toString()) : undefined,
      notes: amendment.notes,
      statusHistory: amendment.statusHistory.map((history) => ({
        id: history.id,
        status: history.status,
        createdAt: history.createdAt.toISOString(),
        notes: history.notes,
        updatedBy: history.updatedBy,
      })),
    }))

    return NextResponse.json({ amendments: formattedAmendments })
  } catch (error) {
    console.error("Error fetching amendments:", error)
    return NextResponse.json({ error: "Failed to fetch amendments" }, { status: 500 })
  }
}

