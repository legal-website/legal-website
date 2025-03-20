import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Test 1: Simple SQL query
    const test1 = await db.$queryRaw`SELECT 1+1 as result`

    // Test 2: Check if Post table exists
    let test2
    try {
      test2 = await db.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'Post'
      `
    } catch (e) {
      test2 = { error: String(e) }
    }

    // Test 3: Try to get all posts
    let test3
    try {
      test3 = await db.$queryRaw`SELECT COUNT(*) as count FROM Post`
    } catch (e) {
      test3 = { error: String(e) }
    }

    // Test 4: Try to get posts with status = 'published'
    let test4
    try {
      test4 = await db.$queryRaw`SELECT COUNT(*) as count FROM Post WHERE status = 'published'`
    } catch (e) {
      test4 = { error: String(e) }
    }

    return NextResponse.json({
      success: true,
      test1,
      test2,
      test3,
      test4,
      message: "SQL tests completed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "SQL tests failed",
      },
      { status: 500 },
    )
  }
}

