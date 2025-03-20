import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Define valid status values
const VALID_STATUSES = {
  PENDING: "pending",
  PUBLISHED: "published",
  DRAFT: "draft",
}

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
      SET status = '${VALID_STATUSES.PENDING}'
      WHERE status IS NULL OR status = ''
    `)

    // Fix any incorrect status values (approved -> published, rejected -> draft)
    await db.$executeRawUnsafe(`
      UPDATE Post
      SET status = '${VALID_STATUSES.PUBLISHED}'
      WHERE status = 'approved'
    `)

    await db.$executeRawUnsafe(`
      UPDATE Post
      SET status = '${VALID_STATUSES.DRAFT}'
      WHERE status = 'rejected'
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

    // Publish all pending posts (optional)
    const body = await request.json()
    if (body.approveAll) {
      await db.$executeRawUnsafe(`
        UPDATE Post
        SET status = '${VALID_STATUSES.PUBLISHED}'
        WHERE status = '${VALID_STATUSES.PENDING}'
      `)
    }

    return NextResponse.json({
      success: true,
      message: "Database data fixed successfully",
      publishedAll: !!body.approveAll,
    })
  } catch (error) {
    console.error("Error fixing data:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

