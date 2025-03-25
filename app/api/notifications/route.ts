import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Get notifications from database
    const notifications = await db.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notification, userId } = await req.json()
    if (!notification || !userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Create notification in database
    const createdNotification = await db.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read || false,
        link: notification.link,
        userId: userId,
      },
    })

    return NextResponse.json({ notification: createdNotification })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

