import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or support
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const commentId = params.id
    const { notes } = await request.json()

    // Update the comment with moderation notes
    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        moderationNotes: notes,
      },
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: updatedComment.id,
        moderationNotes: (updatedComment as any).moderationNotes,
      },
    })
  } catch (error) {
    console.error("Error updating moderation notes:", error)
    return NextResponse.json({ success: false, error: "Failed to update moderation notes" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const commentId = params.id

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {}, // Use include instead of select to avoid TypeScript error
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      moderationNotes: (comment as any).moderationNotes,
    })
  } catch (error) {
    console.error("Error fetching moderation notes:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch moderation notes" }, { status: 500 })
  }
}

