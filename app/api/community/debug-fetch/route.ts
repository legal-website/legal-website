import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "published"

    // Log the request parameters
    console.log("Debug fetch request with status:", status)

    // Try to fetch posts with the given status
    const posts = await db.$queryRawUnsafe(
      `
      SELECT id, title, status FROM Post
      WHERE status = ?
      LIMIT 5
    `,
      status,
    )

    // Get all distinct status values in the database
    const statusValues = await db.$queryRawUnsafe(`
      SELECT DISTINCT status FROM Post
    `)

    return NextResponse.json({
      success: true,
      requestedStatus: status,
      postsFound: posts.length,
      samplePosts: posts,
      allStatusValues: statusValues.map((row: any) => row.status),
      message: "This endpoint helps debug fetch issues",
    })
  } catch (error) {
    console.error("Error in debug-fetch endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Error occurred while debugging fetch",
      },
      { status: 500 },
    )
  }
}

