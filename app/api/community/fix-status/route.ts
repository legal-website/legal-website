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

    // Get all unique status values
    const statusesResult = await db.$queryRawUnsafe(`
    SELECT DISTINCT status FROM Post
  `)

    const statuses = statusesResult.map((row: any) => row.status)

    // Count posts by status
    const counts: Record<string, number> = {}
    for (const status of statuses) {
      const statusKey = status || "null"
      const countResult = await db.$queryRawUnsafe(
        `
      SELECT COUNT(*) as count FROM Post WHERE status = ?
    `,
        status,
      )
      counts[statusKey] = Number(countResult[0].count)
    }

    return NextResponse.json({
      success: true,
      statuses,
      counts,
      validStatuses: Object.values(VALID_STATUSES),
    })
  } catch (error) {
    console.error("Error getting status info:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: "Both 'from' and 'to' status values are required",
        },
        { status: 400 },
      )
    }

    if (!Object.values(VALID_STATUSES).includes(to)) {
      return NextResponse.json(
        {
          success: false,
          error: `'to' must be one of: ${Object.values(VALID_STATUSES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Update posts with the specified status
    const result = await db.$executeRawUnsafe(
      `
    UPDATE Post
    SET status = ?
    WHERE status = ?
  `,
      to,
      from,
    )

    return NextResponse.json({
      success: true,
      message: `Updated posts with status '${from}' to '${to}'`,
      count: result,
    })
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

