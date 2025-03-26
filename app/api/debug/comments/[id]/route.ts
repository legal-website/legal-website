import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Get the comment directly from the database
    const comment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error("Error fetching comment:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comment" }, { status: 500 })
  }
}

