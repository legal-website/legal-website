import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Simple in-memory store for online users
const onlineUsers = new Map<string, Date>()

// Set a shorter timeout for detecting when users go offline (3 minutes)
const ONLINE_TIMEOUT_MS = 3 * 60 * 1000

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 400 })
    }

    // Update the user's online status in memory
    onlineUsers.set(userId, new Date())

    // Update the user's updatedAt timestamp
    await db.user.update({
      where: { id: userId },
      data: {}, // Empty data will trigger Prisma to update the updatedAt field
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating online status:", error)
    return NextResponse.json({ error: "Failed to update online status" }, { status: 500 })
  }
}

// Add a GET endpoint to check which users are online
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clean up users who haven't been active in the last 3 minutes
    const now = new Date()
    for (const [userId, lastSeen] of onlineUsers.entries()) {
      if (now.getTime() - lastSeen.getTime() > ONLINE_TIMEOUT_MS) {
        onlineUsers.delete(userId)
      }
    }

    // Return the list of online user IDs
    return NextResponse.json({
      onlineUsers: Array.from(onlineUsers.keys()),
      count: onlineUsers.size,
    })
  } catch (error) {
    console.error("Error fetching online users:", error)
    return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 })
  }
}

