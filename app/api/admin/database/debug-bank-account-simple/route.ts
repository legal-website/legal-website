import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Validate admin session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Only administrators can access database debug" }, { status: 403 })
    }

    // Get columns for the BankAccount table
    const columnsResult = await db.$queryRawUnsafe(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'BankAccount'
      ORDER BY ORDINAL_POSITION
    `)

    // Get foreign keys for the BankAccount table
    const foreignKeysResult = await db.$queryRawUnsafe(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_NAME = 'BankAccount'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `)

    // Get a sample user to test with - Fixed: Added where clause
    const sampleUser = await db.user.findFirst({
      where: {}, // Empty where clause to satisfy TypeScript
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({
      columns: columnsResult,
      foreignKeys: foreignKeysResult,
      sampleUser,
      success: true,
    })
  } catch (error) {
    console.error("Error debugging bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to debug bank account",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

