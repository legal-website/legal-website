import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    console.log("GET /api/annual-reports/filings - Starting request")

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the table exists by querying information schema
    try {
      const tableExists = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AnnualReportFiling'
        )
      `

      const exists = Array.isArray(tableExists) && tableExists.length > 0 ? tableExists[0].exists : false

      if (!exists) {
        console.log("AnnualReportFiling table does not exist")
        return NextResponse.json({
          filings: [],
          warning: "Annual reports feature is not fully set up",
        })
      }

      // Get filings for the current user
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

      console.log(`Found ${filings.length} filings`)
      return NextResponse.json({ filings })
    } catch (dbError: any) {
      console.error("Database error:", dbError)

      // Return empty array with warning instead of error
      return NextResponse.json({
        filings: [],
        warning: "Could not retrieve filings",
      })
    }
  } catch (error) {
    console.error("Error fetching filings:", error)
    return NextResponse.json(
      {
        filings: [],
        error: "Failed to fetch filings",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Check if the table exists by querying information schema
    try {
      const tableExists = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AnnualReportFiling'
        )
      `

      const exists = Array.isArray(tableExists) && tableExists.length > 0 ? tableExists[0].exists : false

      if (!exists) {
        console.log("AnnualReportFiling table does not exist")
        return NextResponse.json(
          {
            error: "Annual reports feature is not fully set up",
          },
          { status: 500 },
        )
      }

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
    } catch (dbError: any) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        {
          error: "Failed to create filing",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating filing:", error)
    return NextResponse.json(
      {
        error: "Failed to create filing",
      },
      { status: 500 },
    )
  }
}

