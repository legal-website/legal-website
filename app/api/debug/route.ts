import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (commentId) {
      // Get a specific comment
      const comment = await db.comment.findUnique({
        where: { id: commentId },
      })

      return NextResponse.json({
        success: true,
        comment,
      })
    } else {
      // Get all comments with isBestAnswer=true
      const bestAnswers = await db.comment.findMany({
        where: { isBestAnswer: true },
        include: {
          post: {
            select: {
              title: true,
            },
          },
          author: {
            select: {
              name: true,
            },
          },
        },
      })

      // Get all comments with moderationNotes
      const moderatedComments = await db.comment.findMany({
        where: {
          NOT: {
            moderationNotes: null,
          },
        },
        include: {
          post: {
            select: {
              title: true,
            },
          },
          author: {
            select: {
              name: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        bestAnswers,
        moderatedComments,
      })
    }
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ success: false, error: "Debug error" }, { status: 500 })
  }
}

