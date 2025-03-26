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
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format the best answers for response
    const formattedBestAnswers = bestAnswers.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      author: {
        id: comment.author?.id || "",
        name: comment.author?.name || "Unknown",
        avatar: comment.author?.image || `/placeholder.svg?height=40&width=40`,
      },
      post: {
        id: comment.post?.id || "",
        title: comment.post?.title || "Unknown Post",
      },
      date: comment.createdAt.toISOString(),
      moderationNotes: comment.moderationNotes || null,
    }))

    return NextResponse.json({
      success: true,
      bestAnswers: formattedBestAnswers,
    })
  } catch (error) {
    console.error("Error fetching best answers:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch best answers" }, { status: 500 })
  }
}

