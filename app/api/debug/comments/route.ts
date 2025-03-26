import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)

    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's role from the session
    const userRole = (session.user as any).role

    // Log the user's role for debugging
    console.log("User role:", userRole)

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

    // Fetch all comments with their associated posts and authors
    const comments = await db.comment.findMany({
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to 100 comments for performance
    })

    return NextResponse.json({
      success: true,
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        isBestAnswer: comment.isBestAnswer,
        moderationNotes: comment.moderationNotes,
        post: comment.post
          ? {
              id: comment.post.id,
              title: comment.post.title,
            }
          : null,
        author: comment.author
          ? {
              id: comment.author.id,
              name: comment.author.name,
              email: comment.author.email,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Error fetching debug comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 })
  }
}

