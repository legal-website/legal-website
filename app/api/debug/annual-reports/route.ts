import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    const connectionTest = await db.$queryRaw`SELECT 1 as connection_test`

    // Get table information
    const tables = await db.$queryRaw`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('AnnualReportDeadline', 'AnnualReportFiling', 'FilingRequirement')
    `

    // Get column information for each table
    const columns = {}

    for (const tableName of ["AnnualReportDeadline", "AnnualReportFiling", "FilingRequirement"]) {
      const tableColumns = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      `
      columns[tableName] = tableColumns
    }

    // Try a simple query on each table
    let deadlinesCount = 0
    let filingsCount = 0
    let requirementsCount = 0

    try {
      const deadlines = await db.annualReportDeadline.count()
      deadlinesCount = deadlines
    } catch (error) {
      console.error("Error counting deadlines:", error)
    }

    try {
      const filings = await db.annualReportFiling.count()
      filingsCount = filings
    } catch (error) {
      console.error("Error counting filings:", error)
    }

    try {
      const requirements = await db.filingRequirement.count()
      requirementsCount = requirements
    } catch (error) {
      console.error("Error counting requirements:", error)
    }

    return NextResponse.json({
      connectionTest,
      tables,
      columns,
      counts: {
        deadlines: deadlinesCount,
        filings: filingsCount,
        requirements: requirementsCount,
      },
      message: "Database diagnostics completed",
    })
  } catch (error) {
    console.error("Error running diagnostics:", error)
    return NextResponse.json(
      {
        error: "Failed to run diagnostics",
        details: process.env.NODE_ENV === "development" ? (error as any).toString() : undefined,
      },
      { status: 500 },
    )
  }
}

