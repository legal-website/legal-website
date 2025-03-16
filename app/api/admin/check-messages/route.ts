import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and support can check messages
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get recent messages (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // @ts-ignore - Prisma client type issue
    const recentMessages = await db.message.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
        // Messages not from this admin
        NOT: {
          sender: session.user.id,
        },
      },
      take: 1, // We only need to know if there's at least one
    })

    return NextResponse.json({
      hasUnreadMessages: recentMessages.length > 0,
    })
  } catch (error) {
    console.error("Error checking messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

