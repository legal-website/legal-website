import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const isAdmin = (session.user as any).role === "ADMIN"
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Only admins can access this endpoint" }, { status: 403 })
    }

    // Get all comments marked as best answers
    const bestAnswers = await db.comment.findMany({
      where: {
        isBestAnswer: true,
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

    // Get all comments with moderation notes
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
  } catch (error) {
    console.error("Error fetching debug data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch debug data" }, { status: 500 })
  }
}

