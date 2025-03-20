import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === Role.ADMIN

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if tables exist
    const tables = ["Post", "Comment", "Like", "Tag", "PostTag"]
    const tableStatus: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        await db.$queryRawUnsafe(`SELECT * FROM "${table}" LIMIT 1`)
        tableStatus[table] = true
      } catch (error) {
        tableStatus[table] = false
      }
    }

    // Get post counts
    let postCount = 0
    let pendingCount = 0
    let approvedCount = 0
    let rejectedCount = 0

    try {
      if (tableStatus.Post) {
        const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "Post"`)
        postCount = Number.parseInt(countResult[0].count) || 0

        const pendingResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "Post" WHERE status = 'pending'`)
        pendingCount = Number.parseInt(pendingResult[0].count) || 0

        const approvedResult = await db.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "Post" WHERE status = 'approved'`,
        )
        approvedCount = Number.parseInt(approvedResult[0].count) || 0

        const rejectedResult = await db.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "Post" WHERE status = 'rejected'`,
        )
        rejectedCount = Number.parseInt(rejectedResult[0].count) || 0
      }
    } catch (error) {
      console.error("Error getting post counts:", error)
    }

    // Get sample posts
    let samplePosts = []
    try {
      if (tableStatus.Post) {
        samplePosts = await db.$queryRawUnsafe(`
          SELECT id, title, content, status, "authorId", "createdAt", "updatedAt"
          FROM "Post"
          ORDER BY "createdAt" DESC
          LIMIT 5
        `)
      }
    } catch (error) {
      console.error("Error getting sample posts:", error)
    }

    // Get tag counts
    let tagCount = 0
    let sampleTags = []
    try {
      if (tableStatus.Tag) {
        const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "Tag"`)
        tagCount = Number.parseInt(countResult[0].count) || 0

        sampleTags = await db.$queryRawUnsafe(`
          SELECT id, name
          FROM "Tag"
          LIMIT 10
        `)
      }
    } catch (error) {
      console.error("Error getting tag info:", error)
    }

    // Get post-tag relationships
    let postTagCount = 0
    let samplePostTags = []
    try {
      if (tableStatus.PostTag) {
        const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "PostTag"`)
        postTagCount = Number.parseInt(countResult[0].count) || 0

        samplePostTags = await db.$queryRawUnsafe(`
          SELECT pt.id, pt."postId", pt."tagId", t.name as "tagName"
          FROM "PostTag" pt
          JOIN "Tag" t ON pt."tagId" = t.id
          LIMIT 10
        `)
      }
    } catch (error) {
      console.error("Error getting post-tag info:", error)
    }

    return NextResponse.json({
      success: true,
      tableStatus,
      postStats: {
        total: postCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      samplePosts,
      tagStats: {
        total: tagCount,
        samples: sampleTags,
      },
      postTagStats: {
        total: postTagCount,
        samples: samplePostTags,
      },
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ success: false, error: "Debug endpoint failed" }, { status: 500 })
  }
}

