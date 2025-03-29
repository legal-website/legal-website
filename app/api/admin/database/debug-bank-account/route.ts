import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Get BankAccount schema information
    const tableInfo = await db.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'BankAccount'
      ORDER BY ordinal_position
    `)

    // Get foreign key constraints
    const foreignKeys = await db.$queryRawUnsafe(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'BankAccount'
    `)

    // Get sample users
    const users = await db.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
      },
    })

    // Get sample bank accounts
    const bankAccounts = await db.bankAccount.findMany({
      take: 5,
    })

    // Check if userId column exists
    const userIdColumn = Array.isArray(tableInfo) ? tableInfo.find((col: any) => col.column_name === "userId") : null

    // Check if createdBy column exists
    const createdByColumn = Array.isArray(tableInfo)
      ? tableInfo.find((col: any) => col.column_name === "createdBy")
      : null

    return NextResponse.json({
      tableInfo,
      foreignKeys,
      userIdColumn,
      createdByColumn,
      sampleUsers: users,
      sampleBankAccounts: bankAccounts,
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

