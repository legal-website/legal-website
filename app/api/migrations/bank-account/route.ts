import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateSession } from "@/lib/session-utils"

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
      return NextResponse.json({ message: "Only administrators can run migrations" }, { status: 403 })
    }

    // Execute raw SQL to check if columns exist and add them if they don't
    const result = await db.$transaction(async (prisma) => {
      // Check if swiftCode column exists
      const checkSwiftCode = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'BankAccount' 
        AND COLUMN_NAME = 'swiftCode'
      `

      // @ts-ignore - The result is an array with one object that has a count property
      const swiftCodeExists = checkSwiftCode[0].count > 0

      // Check if branchName column exists
      const checkBranchName = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'BankAccount' 
        AND COLUMN_NAME = 'branchName'
      `

      // @ts-ignore - The result is an array with one object that has a count property
      const branchNameExists = checkBranchName[0].count > 0

      // Check if branchCode column exists
      const checkBranchCode = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'BankAccount' 
        AND COLUMN_NAME = 'branchCode'
      `

      // @ts-ignore - The result is an array with one object that has a count property
      const branchCodeExists = checkBranchCode[0].count > 0

      const results = {
        swiftCode: { existed: swiftCodeExists, added: false },
        branchName: { existed: branchNameExists, added: false },
        branchCode: { existed: branchCodeExists, added: false },
      }

      // Add swiftCode column if it doesn't exist
      if (!swiftCodeExists) {
        try {
          await prisma.$executeRaw`
            ALTER TABLE BankAccount 
            ADD COLUMN swiftCode VARCHAR(191) NULL
          `
          results.swiftCode.added = true
        } catch (error) {
          console.error("Error adding swiftCode column:", error)
        }
      }

      // Add branchName column if it doesn't exist
      if (!branchNameExists) {
        try {
          await prisma.$executeRaw`
            ALTER TABLE BankAccount 
            ADD COLUMN branchName VARCHAR(191) NULL
          `
          results.branchName.added = true
        } catch (error) {
          console.error("Error adding branchName column:", error)
        }
      }

      // Add branchCode column if it doesn't exist
      if (!branchCodeExists) {
        try {
          await prisma.$executeRaw`
            ALTER TABLE BankAccount 
            ADD COLUMN branchCode VARCHAR(191) NULL
          `
          results.branchCode.added = true
        } catch (error) {
          console.error("Error adding branchCode column:", error)
        }
      }

      return results
    })

    return NextResponse.json({
      message: "Migration completed",
      results: result,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        message: "Migration failed",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

