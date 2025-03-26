import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get all comments with best answer status
    const commentsResult = await db.$queryRawUnsafe(`
      SELECT 
        c.id, 
        c.content, 
        c.postId, 
        c.authorId, 
        c.isBestAnswer, 
        c.moderationNotes,
        u.name as authorName,
        p.title as postTitle
      FROM "Comment" c
      LEFT JOIN "User" u ON c.authorId = u.id
      LEFT JOIN "Post" p ON c.postId = p.id
      ORDER BY c.createdAt DESC
      LIMIT 50
    `)

    return NextResponse.json({
      success: true,
      comments: commentsResult,
    })
  } catch (error) {
    console.error("Error debugging comments:", error)
    return NextResponse.json({ success: false, error: "Failed to debug comments" }, { status: 500 })
  }
}

