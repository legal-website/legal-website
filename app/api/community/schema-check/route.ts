import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get Post table schema
    let postSchema
    try {
      postSchema = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Post'
      `
    } catch (e) {
      postSchema = { error: String(e) }
    }

    // Get all tables
    let tables
    try {
      tables = await db.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `
    } catch (e) {
      tables = { error: String(e) }
    }

    return NextResponse.json({
      success: true,
      postSchema,
      tables,
      message: "Schema check completed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Schema check failed",
      },
      { status: 500 },
    )
  }
}

