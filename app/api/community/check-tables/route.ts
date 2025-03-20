import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist by querying them
    const tables = ["Post", "Comment", "Like", "Tag", "PostTag"]

    const results: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        // Try to query the table
        await db.$queryRawUnsafe(`SELECT * FROM "${table}" LIMIT 1`)
        results[table] = true
      } catch (error) {
        results[table] = false
      }
    }

    return NextResponse.json({
      success: true,
      tables: results,
    })
  } catch (error) {
    console.error("Error checking community tables:", error)
    return NextResponse.json({ success: false, error: "Failed to check community tables" }, { status: 500 })
  }
}

