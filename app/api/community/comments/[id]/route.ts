import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

// Update a comment
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    // Get the existing comment
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    // Check if user is authorized to update this comment
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingComment.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this comment" }, { status: 403 })
    }

    // Update the comment
    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        content,
      },
    })

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    })
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to update comment" }, { status: 500 })
  }
}

// Delete a comment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Get the existing comment
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    // Check if user is authorized to delete this comment
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingComment.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this comment" }, { status: 403 })
    }

    // Delete the comment (cascade will handle related records)
    await db.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ success: false, error: "Failed to delete comment" }, { status: 500 })
  }
}

