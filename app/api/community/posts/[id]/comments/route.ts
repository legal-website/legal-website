import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // Get all comments for the post with author info
    const commentsResult = await db.$queryRawUnsafe(
      `
      SELECT 
        c.*,
        u.id as authorId,
        u.name as authorName,
        u.image as authorImage,
        (SELECT COUNT(*) FROM "Like" WHERE commentId = c.id) as likeCount
      FROM "Comment" c
      LEFT JOIN "User" u ON c.authorId = u.id
      WHERE c.postId = ?
      ORDER BY c.createdAt DESC
    `,
      postId,
    )

    // Check if current user has liked any of the comments
    const session = await getServerSession(authOptions)
    let userLikes: Record<string, boolean> = {}

    if (session?.user) {
      const likesResult = await db.$queryRawUnsafe(
        `
        SELECT commentId FROM "Like"
        WHERE authorId = ? AND commentId IS NOT NULL
      `,
        (session.user as any).id,
      )

      if (likesResult && likesResult.length > 0) {
        userLikes = likesResult.reduce((acc: Record<string, boolean>, like: any) => {
          acc[like.commentId] = true
          return acc
        }, {})
      }
    }

    // Format comments for response
    const formattedComments = commentsResult.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.authorId || "",
        name: comment.authorName || "Unknown",
        avatar: comment.authorImage || `/placeholder.svg?height=40&width=40`,
      },
      date: comment.createdAt,
      likes: Number.parseInt(comment.likeCount) || 0,
      isLiked: userLikes[comment.id] || false,
      isBestAnswer: comment.isBestAnswer || false,
      moderationNotes: comment.moderationNotes || null,
    }))

    console.log("Formatted comments:", formattedComments)

    return NextResponse.json({
      success: true,
      comments: formattedComments,
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id
    const { content } = await request.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    // Check if post exists
    const postResult = await db.$queryRawUnsafe(
      `
      SELECT * FROM "Post" WHERE id = ?
    `,
      postId,
    )

    if (!postResult || postResult.length === 0) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Create the comment
    const commentId = uuidv4()
    const now = new Date().toISOString()

    await db.$executeRawUnsafe(
      `
      INSERT INTO "Comment" (id, content, authorId, postId, createdAt, updatedAt, isBestAnswer, moderationNotes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      commentId,
      content,
      (session.user as any).id,
      postId,
      now,
      now,
      false, // Initialize isBestAnswer as false
      null, // Initialize moderationNotes as null
    )

    // Format the new comment for response
    const comment = {
      id: commentId,
      content,
      author: {
        id: (session.user as any).id,
        name: session.user.name || "Unknown",
        avatar: session.user.image || `/placeholder.svg?height=40&width=40`,
      },
      date: now,
      likes: 0,
      isLiked: false,
      isBestAnswer: false,
      moderationNotes: null,
    }

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}

