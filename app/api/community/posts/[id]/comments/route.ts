import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id
    console.log("Fetching comments for post:", postId)

    // Use Prisma to get comments with all fields
    const comments = await db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    console.log(`Found ${comments.length} comments`)

    // Log the raw comments to check if isBestAnswer and moderationNotes are present
    console.log(
      "Raw comments data:",
      comments.map((c) => ({
        id: c.id,
        isBestAnswer: c.isBestAnswer,
        moderationNotes: c.moderationNotes,
      })),
    )

    // Check if current user has liked any comments
    const session = await getServerSession(authOptions)
    let likedCommentIds: string[] = []

    if (session?.user && comments.length > 0) {
      const commentLikes = await db.like.findMany({
        where: {
          commentId: {
            in: comments.map((comment) => comment.id),
          },
          authorId: (session.user as any).id,
        },
        select: {
          commentId: true,
        },
      })
      likedCommentIds = commentLikes.map((like) => like.commentId).filter(Boolean) as string[]
    }

    // Format the comments for response
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author?.id || "",
        name: comment.author?.name || "Unknown",
        avatar: comment.author?.image || `/api/placeholder?height=40&width=40`,
      },
      date: comment.createdAt.toISOString(),
      likes: comment._count?.likes || 0,
      isLiked: likedCommentIds.includes(comment.id),
      // Explicitly include these fields
      isBestAnswer: comment.isBestAnswer === true,
      moderationNotes: comment.moderationNotes || null,
    }))

    // Log the formatted comments to check if isBestAnswer and moderationNotes are included
    console.log(
      "Formatted comments:",
      formattedComments.map((c) => ({
        id: c.id,
        isBestAnswer: c.isBestAnswer,
        moderationNotes: c.moderationNotes,
      })),
    )

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
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content,
        postId,
        authorId: (session.user as any).id,
        isBestAnswer: false,
        moderationNotes: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Format the comment for response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author?.id || "",
        name: comment.author?.name || "Unknown",
        avatar: comment.author?.image || `/api/placeholder?height=40&width=40`,
      },
      date: comment.createdAt.toISOString(),
      likes: 0,
      isLiked: false,
      isBestAnswer: false,
      moderationNotes: null,
    }

    return NextResponse.json({
      success: true,
      comment: formattedComment,
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}

