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

    // Get database tables
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    // Get database schema for specific tables
    const schema = {}

    // Check if annual reports tables exist
    const annualReportTables = ["AnnualReportDeadline", "AnnualReportFiling", "FilingRequirement"]

    for (const table of annualReportTables) {
      try {
        const columns = await db.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${table}
        `
        schema[table] = columns
      } catch (error) {
        schema[table] = { error: "Table not found or error querying schema" }
      }
    }

    return NextResponse.json({
      tables,
      schema,
      message: "Database schema retrieved successfully",
    })
  } catch (error) {
    console.error("Error retrieving database schema:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve database schema",
        details: process.env.NODE_ENV === "development" ? (error as any).toString() : undefined,
      },
      { status: 500 },
    )
  }
}

