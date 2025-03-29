import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
}

// Helper function to handle BigInt serialization
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "bigint") {
    return data.toString()
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item))
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {}
    for (const key in data) {
      result[key] = serializeData(data[key])
    }
    return result
  }

  return data
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
      return NextResponse.json({ message: "Only administrators can check database schema" }, { status: 403 })
    }

    // Get the table to check from query params
    const url = new URL(req.url)
    const table = url.searchParams.get("table") || "BankAccount"

    // Get columns for the table
    const columnsResult = await db.$queryRawUnsafe(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `)

    // Get indexes for the table
    const indexesResult = await db.$queryRawUnsafe(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_NAME = '${table}'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `)

    // Process indexes to group by index name
    const indexes: Record<string, IndexInfo> = {}
    if (Array.isArray(indexesResult)) {
      indexesResult.forEach((idx: any) => {
        const indexName = idx.INDEX_NAME as string
        if (!indexes[indexName]) {
          indexes[indexName] = {
            name: indexName,
            columns: [],
            unique: idx.NON_UNIQUE === 0,
          }
        }
        indexes[indexName].columns.push(idx.COLUMN_NAME as string)
      })
    }

    // Serialize the data to handle BigInt values
    const serializedColumns = serializeData(columnsResult)
    const serializedIndexes = serializeData(Object.values(indexes))

    return NextResponse.json({
      table,
      columns: serializedColumns,
      indexes: serializedIndexes,
      success: true,
    })
  } catch (error) {
    console.error("Error checking database schema:", error)
    return NextResponse.json(
      {
        message: "Failed to check database schema",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

