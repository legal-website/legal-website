import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or support
    const isAdmin = (session.user as any).role === Role.ADMIN || (session.user as any).role === Role.SUPPORT
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Only admins can add moderation notes" }, { status: 403 })
    }

    const commentId = params.id
    const body = await request.json()
    const { moderationNotes } = body

    if (moderationNotes === undefined) {
      return NextResponse.json({ success: false, error: "Moderation notes are required" }, { status: 400 })
    }

    console.log(`Updating moderation notes for comment ${commentId}:`, moderationNotes)

    // Update the comment with moderation notes
    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        moderationNotes: moderationNotes,
      },
    })

    console.log("Comment updated successfully:", updatedComment)

    return NextResponse.json({
      success: true,
      comment: {
        id: updatedComment.id,
        moderationNotes: updatedComment.moderationNotes,
      },
    })
  } catch (error) {
    console.error("Error updating moderation notes:", error)
    return NextResponse.json({ success: false, error: "Failed to update moderation notes" }, { status: 500 })
  }
}

