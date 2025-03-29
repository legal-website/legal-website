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
      return NextResponse.json({ message: "Only administrators can fix database schema" }, { status: 403 })
    }

    // Check if userId column exists
    const userIdExists = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE 
        TABLE_NAME = 'BankAccount'
        AND COLUMN_NAME = 'userId'
    `)

    // Check if createdBy column exists
    const createdByExists = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE 
        TABLE_NAME = 'BankAccount'
        AND COLUMN_NAME = 'createdBy'
    `)

    // Get Prisma schema for BankAccount
    const prismaSchema = await db.$queryRawUnsafe(`
      SELECT * FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `)

    // Get sample bank accounts
    const bankAccounts = await db.bankAccount.findMany({
      take: 5,
    })

    // Fix the schema issue by copying createdBy to userId if needed
    let fixResult = { fixed: false, message: "No fix needed" }

    if (Array.isArray(userIdExists) && Array.isArray(createdByExists)) {
      const hasUserId = userIdExists[0].count > 0
      const hasCreatedBy = createdByExists[0].count > 0

      if (hasUserId && hasCreatedBy) {
        // Copy createdBy values to userId for all records
        await db.$executeRawUnsafe(`
          UPDATE BankAccount
          SET userId = createdBy
          WHERE userId != createdBy
        `)

        fixResult = {
          fixed: true,
          message: "Updated userId to match createdBy for all bank accounts",
        }
      }
    }

    return NextResponse.json({
      userIdExists,
      createdByExists,
      prismaSchema,
      sampleBankAccounts: bankAccounts,
      fixResult,
      success: true,
    })
  } catch (error) {
    console.error("Error fixing bank account schema:", error)
    return NextResponse.json(
      {
        message: "Failed to fix bank account schema",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

