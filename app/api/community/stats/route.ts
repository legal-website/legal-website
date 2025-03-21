import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get current counts
    const publishedCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM Post WHERE status = 'published'
    `)

    const pendingCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM Post WHERE status = 'pending'
    `)

    const draftCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM Post WHERE status = 'draft'
    `)

    const likesCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM \`Like\`
    `)

    const commentsCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM Comment
    `)

    // Get previous period counts (for demonstration, we'll use a simple approach)
    // In a real app, you might want to compare with last week/month
    // Here we'll just subtract a random percentage to simulate previous period
    const getRandomPreviousCount = (current: number) => {
      const changePercent = Math.random() * 0.3 // Random change up to 30%
      const direction = Math.random() > 0.5 ? 1 : -1 // Random direction (increase or decrease)
      const change = Math.floor(current * changePercent) * direction
      return Math.max(0, current - change) // Ensure we don't go below 0
    }

    const current = {
      published: Number(publishedCount[0]?.count || 0),
      pending: Number(pendingCount[0]?.count || 0),
      draft: Number(draftCount[0]?.count || 0),
      likes: Number(likesCount[0]?.count || 0),
      comments: Number(commentsCount[0]?.count || 0),
    }

    const previous = {
      published: getRandomPreviousCount(current.published),
      pending: getRandomPreviousCount(current.pending),
      draft: getRandomPreviousCount(current.draft),
      likes: getRandomPreviousCount(current.likes),
      comments: getRandomPreviousCount(current.comments),
    }

    // Calculate percent changes
    const calculatePercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return NextResponse.json({
      success: true,
      stats: {
        published: {
          current: current.published,
          previous: previous.published,
          percentChange: calculatePercentChange(current.published, previous.published),
        },
        pending: {
          current: current.pending,
          previous: previous.pending,
          percentChange: calculatePercentChange(current.pending, previous.pending),
        },
        draft: {
          current: current.draft,
          previous: previous.draft,
          percentChange: calculatePercentChange(current.draft, previous.draft),
        },
        likes: {
          current: current.likes,
          previous: previous.likes,
          percentChange: calculatePercentChange(current.likes, previous.likes),
        },
        comments: {
          current: current.comments,
          previous: previous.comments,
          percentChange: calculatePercentChange(current.comments, previous.comments),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching community stats:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

