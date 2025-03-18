import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    console.log("GET /api/admin/annual-reports/filings - Starting request")

    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
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

      // Get all filings with user and deadline info
      const filings = await db.annualReportFiling.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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

