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

    // Check if user is an admin or support
    const userRole = (session.user as any).role
    const isAuthorized = userRole === Role.ADMIN || userRole === Role.SUPPORT
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Only admins and support staff can add moderation notes" },
        { status: 403 },
      )
    }

    const commentId = params.id
    const body = await request.json()
    const { moderationNotes } = body

    if (moderationNotes === undefined) {
      return NextResponse.json({ success: false, error: "Moderation notes are required" }, { status: 400 })
    }

    // Get the existing comment
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    // Update the comment with moderation notes
    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        moderationNotes,
      },
    })

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    })
  } catch (error) {
    console.error("Error updating moderation notes:", error)
    return NextResponse.json({ success: false, error: "Failed to update moderation notes" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const commentId = params.id

    // Get the comment with moderation notes
    const comment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      moderationNotes: comment.moderationNotes,
    })
  } catch (error) {
    console.error("Error fetching moderation notes:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch moderation notes" }, { status: 500 })
  }
}

