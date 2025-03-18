import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get filings for the current user with deadline info
    const filings = await prisma.annualReportFiling.findMany({
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
    return NextResponse.json({ error: "Failed to fetch filings" }, { status: 500 })
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
    const filing = await prisma.annualReportFiling.create({
      data: {
        userId: session.user.id,
        deadlineId: data.deadlineId,
        receiptUrl: data.receiptUrl,
        userNotes: data.userNotes,
        status: "pending_payment",
      },
    })

    return NextResponse.json({ filing })
  } catch (error) {
    console.error("Error creating filing:", error)
    return NextResponse.json({ error: "Failed to create filing" }, { status: 500 })
  }
}

