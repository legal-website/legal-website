import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Direct raw query to get all posts regardless of status
    const rawPosts = await db.$queryRawUnsafe(`
      SELECT 
        p.id, p.title, p.content, p.status, p.authorId, p.createdAt, p.updatedAt,
        u.id as userId, u.name as userName, u.image as userImage
      FROM Post p
      LEFT JOIN User u ON p.authorId = u.id
    `)

    // Get the count of posts by status
    const statusCounts = await db.$queryRawUnsafe(`
      SELECT status, COUNT(*) as count
      FROM Post
      GROUP BY status
    `)

    return NextResponse.json({
      success: true,
      rawPosts,
      statusCounts,
      message: "This endpoint shows all posts directly from the database",
    })
  } catch (error) {
    console.error("Error in debug-posts endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Error fetching posts directly from database",
      },
      { status: 500 },
    )
  }
}

