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

    // Check if FilingRequirement table exists - MariaDB syntax
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'FilingRequirement'
      `

      const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

      // If table exists, check its columns
      if (tableExists) {
        const columns = await prisma.$queryRaw`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'FilingRequirement'
        `

        return NextResponse.json({
          tableExists: true,
          columns,
          message: "FilingRequirement table exists",
        })
      } else {
        return NextResponse.json({
          tableExists: false,
          message: "FilingRequirement table does not exist",
        })
      }
    } catch (error) {
      console.error("Error checking requirement table:", error)
      return NextResponse.json(
        {
          error: "Error checking requirement table",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in check-requirement-table route:", error)
    return NextResponse.json(
      {
        error: "Failed to check requirement table",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

