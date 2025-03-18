import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tables = ["AnnualReportDeadline", "AnnualReportFiling", "FilingRequirement"]
    const results: Record<string, any> = {}

    for (const tableName of tables) {
      try {
        // Check if table exists
        const tableCheck = await prisma.$queryRaw`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ${tableName}
        `

        const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

        if (tableExists) {
          // Get column information
          const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ${tableName}
          `

          results[tableName] = {
            exists: true,
            columns,
          }
        } else {
          results[tableName] = {
            exists: false,
          }
        }
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error)
        results[tableName] = {
          exists: false,
          error: (error as Error).message,
        }
      }
    }

    return NextResponse.json({
      results,
      message: "Table check completed",
    })
  } catch (error) {
    console.error("Error in check-all-tables route:", error)
    return NextResponse.json(
      {
        error: "Failed to check tables",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

