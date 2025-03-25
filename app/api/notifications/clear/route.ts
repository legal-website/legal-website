import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await req.json()
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Delete all notifications for the user
    await db.notification.deleteMany({
      where: {
        userId: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing notifications:", error)
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 })
  }
}

