import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
}

interface AlterResult {
  column: string
  status: string
  success: boolean
  error?: string
}

interface TableSyncResult {
  message: string
  table?: string
  missingColumns?: string[]
  alterResults?: AlterResult[]
  currentColumns?: string[]
  success: boolean
  error?: string
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
      return NextResponse.json({ message: "Only administrators can sync database schema" }, { status: 403 })
    }

    // Get the table to sync from query params
    const url = new URL(req.url)
    const table = url.searchParams.get("table") || "BankAccount"

    // Define the expected columns for each table
    const tableColumns: Record<string, ColumnDefinition[]> = {
      BankAccount: [
        { name: "id", type: "VARCHAR(191)", nullable: false },
        { name: "accountName", type: "VARCHAR(191)", nullable: false },
        { name: "accountNumber", type: "VARCHAR(191)", nullable: false },
        { name: "routingNumber", type: "VARCHAR(191)", nullable: false },
        { name: "bankName", type: "VARCHAR(191)", nullable: false },
        { name: "accountType", type: "VARCHAR(191)", nullable: false },
        { name: "swiftCode", type: "VARCHAR(191)", nullable: true },
        { name: "branchName", type: "VARCHAR(191)", nullable: true },
        { name: "branchCode", type: "VARCHAR(191)", nullable: true },
        { name: "isDefault", type: "BOOLEAN", nullable: false },
        { name: "createdBy", type: "VARCHAR(191)", nullable: false },
        { name: "createdAt", type: "DATETIME(3)", nullable: false },
        { name: "updatedAt", type: "DATETIME(3)", nullable: false },
      ],
      // Add other tables as needed
    }

    // Check if the requested table is supported
    if (!tableColumns[table]) {
      return NextResponse.json(
        {
          message: `Table '${table}' is not supported for schema sync`,
        },
        { status: 400 },
      )
    }

    // Get existing columns for the table
    const existingColumnsResult = await db.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
    `)

    // Convert to a more usable format
    const existingColumns = Array.isArray(existingColumnsResult)
      ? existingColumnsResult.map((col: any) => col.COLUMN_NAME.toLowerCase())
      : []

    // Identify missing columns
    const missingColumns = tableColumns[table].filter((col) => !existingColumns.includes(col.name.toLowerCase()))

    // Add missing columns
    const alterResults: AlterResult[] = []
    for (const column of missingColumns) {
      try {
        const nullableStr = column.nullable ? "NULL" : "NOT NULL"
        const defaultValue = column.name === "isDefault" ? "DEFAULT false" : ""

        // Use string template for the SQL query
        const query = `
          ALTER TABLE \`${table}\` 
          ADD COLUMN \`${column.name}\` ${column.type} ${nullableStr} ${defaultValue}
        `

        await db.$executeRawUnsafe(query)

        alterResults.push({
          column: column.name,
          status: "added",
          success: true,
        })
      } catch (error) {
        console.error(`Error adding column ${column.name}:`, error)
        alterResults.push({
          column: column.name,
          status: "failed",
          success: false,
          error: String(error),
        })
      }
    }

    // Get updated columns
    const updatedColumnsResult = await db.$queryRawUnsafe(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
    `)

    const updatedColumns = Array.isArray(updatedColumnsResult)
      ? updatedColumnsResult.map((col: any) => col.COLUMN_NAME)
      : []

    return NextResponse.json({
      message: `Schema sync completed for table '${table}'`,
      table,
      missingColumns: missingColumns.map((col) => col.name),
      alterResults,
      currentColumns: updatedColumns,
      success: true,
    })
  } catch (error) {
    console.error("Error syncing database schema:", error)
    return NextResponse.json(
      {
        message: "Failed to sync database schema",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

// POST endpoint to sync multiple tables or specific columns
export async function POST(req: NextRequest) {
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
      return NextResponse.json({ message: "Only administrators can sync database schema" }, { status: 403 })
    }

    const data = await req.json()
    const { tables = ["BankAccount"] } = data

    const results: Record<string, TableSyncResult> = {}

    for (const table of tables) {
      try {
        // Instead of creating a new Request, we'll directly call the GET function
        // with a modified NextRequest
        const url = new URL(req.url)
        url.searchParams.set("table", table)

        // Create a new NextRequest with the modified URL
        const tableReq = new NextRequest(url, {
          headers: req.headers,
          method: "GET",
        })

        const tableRes = await GET(tableReq)
        const tableData = await tableRes.json()

        results[table] = tableData
      } catch (error) {
        results[table] = {
          message: `Failed to sync schema for table '${table}'`,
          error: String(error),
          success: false,
        }
      }
    }

    return NextResponse.json({
      message: "Schema sync completed for all requested tables",
      results,
      success: true,
    })
  } catch (error) {
    console.error("Error syncing database schema:", error)
    return NextResponse.json(
      {
        message: "Failed to sync database schema",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

