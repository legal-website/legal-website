import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

// Mark or unmark a comment as best answer
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const isAdmin = (session.user as any).role === Role.ADMIN
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Only admins can mark best answers" }, { status: 403 })
    }

    const commentId = params.id
    const body = await request.json()
    const { postId, isBestAnswer } = body

    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID is required" }, { status: 400 })
    }

    // Get the existing comment
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    // If marking as best answer, first unmark any existing best answers for this post
    if (isBestAnswer) {
      // Find all comments that are currently marked as best answers for this post
      const bestAnswers = await db.comment.findMany({
        where: {
          postId: postId,
          isBestAnswer: true,
        },
      })

      // Update each comment individually to unmark it as best answer
      for (const comment of bestAnswers) {
        await db.comment.update({
          where: { id: comment.id },
          data: {
            isBestAnswer: false,
          },
        })
      }
    }

    // Update the comment
    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        isBestAnswer,
      },
    })

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    })
  } catch (error) {
    console.error("Error updating best answer status:", error)
    return NextResponse.json({ success: false, error: "Failed to update best answer status" }, { status: 500 })
  }
}

