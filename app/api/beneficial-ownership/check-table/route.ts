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

    // Check if BeneficialOwner table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'BeneficialOwner'
      `

      const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

      // If table exists, check its columns
      if (tableExists) {
        const columns = await prisma.$queryRaw`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'BeneficialOwner'
        `

        return NextResponse.json({
          tableExists: true,
          columns,
          message: "BeneficialOwner table exists",
        })
      } else {
        return NextResponse.json({
          tableExists: false,
          message: "BeneficialOwner table does not exist",
        })
      }
    } catch (error) {
      console.error("Error checking BeneficialOwner table:", error)
      return NextResponse.json(
        {
          error: "Error checking BeneficialOwner table",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in check-table route:", error)
    return NextResponse.json(
      {
        error: "Failed to check BeneficialOwner table",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

