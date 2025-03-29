import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get limit from query params or default to 5
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    // Fetch recent comments with post and author information
    const comments = await db.comment.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Format the comments for the response
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postTitle: comment.post?.title || "Unknown Post",
      postId: comment.postId,
      author: {
        id: comment.author?.id || "unknown",
        name: comment.author?.name || "Anonymous",
        avatar: comment.author?.image || null,
      },
      createdAt: comment.createdAt,
      status: comment.status || "pending",
    }))

    return NextResponse.json({
      success: true,
      comments: formattedComments,
    })
  } catch (error) {
    console.error("Error fetching recent comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch recent comments" }, { status: 500 })
  }
}

