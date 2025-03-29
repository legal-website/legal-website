import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

interface ColumnStatus {
  existed: boolean
  added: boolean
}

interface BankAccountFixResults {
  swiftCode: ColumnStatus
  branchName: ColumnStatus
  branchCode: ColumnStatus
  isDefault: ColumnStatus
}

interface IndexStatus {
  existed: boolean
  added: boolean
}

interface IndexFixResults {
  isDefault: IndexStatus
  createdBy: IndexStatus
}

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
      return NextResponse.json({ message: "Only administrators can fix the database schema" }, { status: 403 })
    }

    // Check if the BankAccount table exists
    const tableExists = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'BankAccount'
    `)

    // @ts-ignore - The result is an array with one object that has a count property
    const exists = tableExists[0].count > 0

    if (!exists) {
      return NextResponse.json(
        {
          message: "BankAccount table does not exist",
          success: false,
        },
        { status: 404 },
      )
    }

    // Check which columns exist
    const columnsResult = await db.$queryRawUnsafe(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'BankAccount'
    `)

    const existingColumns = Array.isArray(columnsResult)
      ? columnsResult.map((col: any) => col.COLUMN_NAME.toLowerCase())
      : []

    const results: BankAccountFixResults = {
      swiftCode: { existed: false, added: false },
      branchName: { existed: false, added: false },
      branchCode: { existed: false, added: false },
      isDefault: { existed: false, added: false },
    }

    // Check if each column exists
    results.swiftCode.existed = existingColumns.includes("swiftcode")
    results.branchName.existed = existingColumns.includes("branchname")
    results.branchCode.existed = existingColumns.includes("branchcode")
    results.isDefault.existed = existingColumns.includes("isdefault")

    // Add missing columns
    if (!results.swiftCode.existed) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE BankAccount 
          ADD COLUMN swiftCode VARCHAR(191) NULL
        `)
        results.swiftCode.added = true
      } catch (error) {
        console.error("Error adding swiftCode column:", error)
      }
    }

    if (!results.branchName.existed) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE BankAccount 
          ADD COLUMN branchName VARCHAR(191) NULL
        `)
        results.branchName.added = true
      } catch (error) {
        console.error("Error adding branchName column:", error)
      }
    }

    if (!results.branchCode.existed) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE BankAccount 
          ADD COLUMN branchCode VARCHAR(191) NULL
        `)
        results.branchCode.added = true
      } catch (error) {
        console.error("Error adding branchCode column:", error)
      }
    }

    if (!results.isDefault.existed) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE BankAccount 
          ADD COLUMN isDefault BOOLEAN NOT NULL DEFAULT false
        `)
        results.isDefault.added = true
      } catch (error) {
        console.error("Error adding isDefault column:", error)
      }
    }

    // Check if indexes exist
    const indexesResult = await db.$queryRawUnsafe(`
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_NAME = 'BankAccount'
      GROUP BY INDEX_NAME
    `)

    const existingIndexes = Array.isArray(indexesResult)
      ? indexesResult.map((idx: any) => idx.INDEX_NAME.toLowerCase())
      : []

    // Add missing indexes
    const indexResults: IndexFixResults = {
      isDefault: { existed: false, added: false },
      createdBy: { existed: false, added: false },
    }

    indexResults.isDefault.existed = existingIndexes.includes("bankaccount_isdefault_idx")
    indexResults.createdBy.existed = existingIndexes.includes("bankaccount_createdby_idx")

    if (!indexResults.isDefault.existed && results.isDefault.existed) {
      try {
        await db.$executeRawUnsafe(`CREATE INDEX \`BankAccount_isDefault_idx\` ON \`BankAccount\`(\`isDefault\`)`)
        indexResults.isDefault.added = true
      } catch (error) {
        console.error("Error adding isDefault index:", error)
      }
    }

    if (!indexResults.createdBy.existed) {
      try {
        await db.$executeRawUnsafe(`CREATE INDEX \`BankAccount_createdBy_idx\` ON \`BankAccount\`(\`createdBy\`)`)
        indexResults.createdBy.added = true
      } catch (error) {
        console.error("Error adding createdBy index:", error)
      }
    }

    return NextResponse.json({
      message: "BankAccount table fixed successfully",
      columns: results,
      indexes: indexResults,
      success: true,
    })
  } catch (error) {
    console.error("Error fixing BankAccount table:", error)
    return NextResponse.json(
      {
        message: "Failed to fix BankAccount table",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

