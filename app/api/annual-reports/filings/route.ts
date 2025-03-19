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

    // Get filings for the current user
    const filings = await prisma.annualReportFiling.findMany({
      where: {
        userId: session.user.id,
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
    console.log("Creating filing with data:", data)

    // Validate required fields
    if (!data.deadlineId) {
      return NextResponse.json({ error: "Deadline ID is required" }, { status: 400 })
    }

    if (!data.receiptUrl) {
      return NextResponse.json({ error: "Receipt URL is required" }, { status: 400 })
    }

    // Create a new filing
    try {
      const filing = await prisma.annualReportFiling.create({
        data: {
          userId: session.user.id,
          deadlineId: data.deadlineId,
          receiptUrl: data.receiptUrl,
          userNotes: data.userNotes || null,
          status: "pending_payment",
          updatedAt: new Date(), // Ensure updatedAt is set
        },
      })

      console.log("Filing created successfully:", filing)
      return NextResponse.json({ filing })
    } catch (dbError: any) {
      console.error("Database error creating filing:", dbError)
      console.error("Error code:", dbError.code)
      console.error("Error message:", dbError.message)

      if (dbError.meta) {
        console.error("Error meta:", dbError.meta)
      }

      return NextResponse.json(
        {
          error: "Database error creating filing",
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error creating filing:", error)
    return NextResponse.json(
      {
        error: "Failed to create filing",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

