import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Toggle like on a post or comment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, commentId } = body

    if (!postId && !commentId) {
      return NextResponse.json({ success: false, error: "Either postId or commentId is required" }, { status: 400 })
    }

    const authorId = (session.user as any).id

    // Check if the user has already liked this post/comment
    const existingLike = await db.like.findFirst({
      where: {
        authorId,
        ...(postId ? { postId } : {}),
        ...(commentId ? { commentId } : {}),
      },
    })

    if (existingLike) {
      // Unlike
      await db.like.delete({
        where: { id: existingLike.id },
      })

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Like removed successfully",
      })
    } else {
      // Like
      await db.like.create({
        data: {
          authorId,
          ...(postId ? { postId } : {}),
          ...(commentId ? { commentId } : {}),
        },
      })

      return NextResponse.json({
        success: true,
        liked: true,
        message: "Liked successfully",
      })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 })
  }
}

