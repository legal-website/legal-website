import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { read, userId } = await req.json()
    if (read === undefined || !userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Update notification in database
    const updatedNotification = await db.notification.update({
      where: {
        id: params.id,
        userId: userId,
      },
      data: {
        read,
      },
    })

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

