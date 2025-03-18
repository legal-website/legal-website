import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get filings for the current user with deadline info
    const filings = await db.annualReportFiling.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        deadline: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ filings })
  } catch (error) {
    console.error("Error fetching filings:", error)
    return NextResponse.json({ filings: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Create a new filing
    const filing = await db.annualReportFiling.create({
      data: {
        userId: session.user.id,
        deadlineId: data.deadlineId,
        receiptUrl: data.receiptUrl,
        userNotes: data.userNotes,
        status: "pending_payment",
      },
      include: {
        deadline: true,
      },
    })

    return NextResponse.json({ filing })
  } catch (error) {
    console.error("Error creating filing:", error)
    return NextResponse.json({ error: "Failed to create filing" }, { status: 500 })
  }
}

