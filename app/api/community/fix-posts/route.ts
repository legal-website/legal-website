import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === Role.ADMIN

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "approve-all-pending") {
      // Approve all pending posts
      await db.$executeRawUnsafe(`
        UPDATE "Post"
        SET status = 'approved'
        WHERE status = 'pending'
      `)

      return NextResponse.json({
        success: true,
        message: "All pending posts have been approved",
      })
    }

    if (action === "fix-missing-status") {
      // Fix posts with missing status
      await db.$executeRawUnsafe(`
        UPDATE "Post"
        SET status = 'pending'
        WHERE status IS NULL OR status = ''
      `)

      return NextResponse.json({
        success: true,
        message: "Fixed posts with missing status",
      })
    }

    if (action === "fix-dates") {
      // Fix posts with missing dates
      await db.$executeRawUnsafe(`
        UPDATE "Post"
        SET "createdAt" = CURRENT_TIMESTAMP
        WHERE "createdAt" IS NULL
      `)

      await db.$executeRawUnsafe(`
        UPDATE "Post"
        SET "updatedAt" = CURRENT_TIMESTAMP
        WHERE "updatedAt" IS NULL
      `)

      return NextResponse.json({
        success: true,
        message: "Fixed posts with missing dates",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error fixing posts:", error)
    return NextResponse.json({ success: false, error: "Failed to fix posts" }, { status: 500 })
  }
}

