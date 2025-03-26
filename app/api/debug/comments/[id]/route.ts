import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)

    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's role from the session
    const userRole = (session.user as any).role

    // Allow access for ADMIN, SUPPORT, and CLIENT roles
    const allowedRoles = [Role.ADMIN, Role.SUPPORT, Role.CLIENT, "ADMIN", "SUPPORT", "CLIENT"]

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Insufficient permissions",
          debug: {
            userRole,
            allowedRoles,
            session: session,
          },
        },
        { status: 403 },
      )
    }

    const commentId = params.id

    // Fetch the comment with its associated post and author
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        likes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isBestAnswer: comment.isBestAnswer,
        moderationNotes: comment.moderationNotes,
        post: comment.post
          ? {
              id: comment.post.id,
              title: comment.post.title,
              content: comment.post.content,
            }
          : null,
        author: comment.author
          ? {
              id: comment.author.id,
              name: comment.author.name,
              email: comment.author.email,
            }
          : null,
        // Add null check for likes array
        likes: comment.likes
          ? comment.likes.map((like) => ({
              id: like.id,
              createdAt: like.createdAt,
              author: like.author
                ? {
                    id: like.author.id,
                    name: like.author.name,
                  }
                : null,
            }))
          : [],
      },
    })
  } catch (error) {
    console.error("Error fetching debug comment:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comment" }, { status: 500 })
  }
}

