import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Define valid status values based on what's actually in the database
const VALID_STATUSES = {
  PENDING: "pending",
  PUBLISHED: "published",
  DRAFT: "draft",
}

export async function GET() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get all posts with their status
    const posts = await db.$queryRawUnsafe(`
    SELECT id, title, status FROM Post
  `)

    // Count posts by status
    const statusCounts: Record<string, number> = {}
    posts.forEach((post: any) => {
      const status = post.status || "null"
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Check for invalid statuses
    const validStatusValues = Object.values(VALID_STATUSES)
    const invalidStatuses = Object.keys(statusCounts).filter(
      (status) => !validStatusValues.includes(status) && status !== "null",
    )

    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      statusCounts,
      invalidStatuses,
      validStatusValues,
    })
  } catch (error) {
    console.error("Error checking post statuses:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fix null or empty statuses
    await db.$executeRawUnsafe(`
    UPDATE Post
    SET status = '${VALID_STATUSES.PENDING}'
    WHERE status IS NULL OR status = ''
  `)

    // Fix "approved" status (if any exists from previous code)
    await db.$executeRawUnsafe(`
    UPDATE Post
    SET status = '${VALID_STATUSES.PUBLISHED}'
    WHERE status = 'approved'
  `)

    // Fix "rejected" status (if any exists from previous code)
    await db.$executeRawUnsafe(`
    UPDATE Post
    SET status = '${VALID_STATUSES.DRAFT}'
    WHERE status = 'rejected'
  `)

    // Get updated status counts
    const statusCounts = await db.$queryRawUnsafe(`
    SELECT status, COUNT(*) as count
    FROM Post
    GROUP BY status
  `)

    const formattedStatusCounts: Record<string, number> = {}
    for (const row of statusCounts as any[]) {
      const statusKey = row.status || "null"
      formattedStatusCounts[statusKey] = Number(row.count)
    }

    return NextResponse.json({
      success: true,
      message: "Post statuses fixed successfully",
      statusCounts: formattedStatusCounts,
    })
  } catch (error) {
    console.error("Error fixing post statuses:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

