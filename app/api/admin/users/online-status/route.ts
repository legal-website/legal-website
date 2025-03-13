import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// In-memory store for online users
const onlineUsers = new Map<string, Date>()

// Clean up inactive users every 5 minutes
setInterval(
  () => {
    const now = new Date()
    for (const [userId, lastSeen] of onlineUsers.entries()) {
      // If user hasn't been seen in 5 minutes, consider them offline
      if (now.getTime() - lastSeen.getTime() > 5 * 60 * 1000) {
        onlineUsers.delete(userId)
      }
    }
  },
  5 * 60 * 1000,
)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Update the user's online status in memory
    onlineUsers.set(userId, new Date())

    // Update the user's updatedAt field instead of lastActive
    await db.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(), // Use updatedAt as a proxy for lastActive
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating online status:", error)
    return NextResponse.json({ error: "Failed to update online status" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all online users
    const onlineUserIds = Array.from(onlineUsers.keys())

    return NextResponse.json({ onlineUsers: onlineUserIds })
  } catch (error) {
    console.error("Error fetching online users:", error)
    return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 })
  }
}

