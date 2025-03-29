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

    // Get a sample user
    const sampleUser = await db.user.findFirst({
      where: {}, // Empty where clause to satisfy TypeScript
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Get bank accounts for the sample user if found
    let bankAccounts = []
    if (sampleUser) {
      try {
        // Try using Prisma first
        bankAccounts = await db.bankAccount.findMany({
          where: {
            createdBy: sampleUser.id,
          },
        })
      } catch (err) {
        console.error("Error fetching bank accounts with Prisma:", err)

        // Fallback to raw SQL
        try {
          bankAccounts = await db.$queryRawUnsafe(`
            SELECT * FROM BankAccount 
            WHERE createdBy = '${sampleUser.id}'
            LIMIT 10
          `)
        } catch (sqlErr) {
          console.error("Error fetching bank accounts with SQL:", sqlErr)
        }
      }
    }

    // Get User table schema
    const userColumns = await db.$queryRawUnsafe(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'User'
      ORDER BY ORDINAL_POSITION
    `)

    // Get BankAccount table schema
    const bankAccountColumns = await db.$queryRawUnsafe(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'BankAccount'
      ORDER BY ORDINAL_POSITION
    `)

    return NextResponse.json({
      sampleUser,
      bankAccounts,
      userColumns,
      bankAccountColumns,
      success: true,
    })
  } catch (error) {
    console.error("Error checking user:", error)
    return NextResponse.json(
      {
        message: "Failed to check user",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

