import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fix any null or empty status values
    await db.$executeRawUnsafe(`
      UPDATE Post
      SET status = 'pending'
      WHERE status IS NULL OR status = ''
    `)

    // Fix any null dates
    await db.$executeRawUnsafe(`
      UPDATE Post
      SET createdAt = CURRENT_TIMESTAMP
      WHERE createdAt IS NULL
    `)

    await db.$executeRawUnsafe(`
      UPDATE Post
      SET updatedAt = CURRENT_TIMESTAMP
      WHERE updatedAt IS NULL
    `)

    // Approve all pending posts (optional)
    const body = await request.json()
    if (body.approveAll) {
      await db.$executeRawUnsafe(`
        UPDATE Post
        SET status = 'approved'
        WHERE status = 'pending'
      `)
    }

    return NextResponse.json({
      success: true,
      message: "Database data fixed successfully",
      approvedAll: !!body.approveAll,
    })
  } catch (error) {
    console.error("Error fixing data:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

