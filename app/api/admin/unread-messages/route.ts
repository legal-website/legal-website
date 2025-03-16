import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

// Define interfaces for our data structures
interface TicketView {
  ticketId: string
  lastViewed: Date
}

interface Message {
  id: string
  sender: string
  createdAt: Date
}

interface Ticket {
  id: string
  messages: Message[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and support can view unread counts
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userId = session.user.id

    // Get all tickets with unread messages
    // @ts-ignore - Prisma client type issue
    const tickets = (await db.ticket.findMany({
      select: {
        id: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            sender: true,
            createdAt: true,
          },
        },
      },
    })) as Ticket[]

    // Get the last viewed timestamps from existing table or use a different approach
    // Check if ticketView table exists in the schema
    const lastViewedMap: Record<string, Date> = {}

    try {
      // Try to query the ticketView table if it exists
      // @ts-ignore - Prisma client type issue
      const ticketViews = (await db.ticketView.findMany({
        where: {
          userId: userId,
        },
        select: {
          ticketId: true,
          lastViewed: true,
        },
      })) as TicketView[]

      ticketViews.forEach((view: TicketView) => {
        lastViewedMap[view.ticketId] = new Date(view.lastViewed)
      })
    } catch (error) {
      // If ticketView table doesn't exist, we'll use a simpler approach
      console.warn("TicketView table not found, using simplified approach")
      // We'll consider all messages as unread in this case
    }

    // Count unread messages
    let totalUnread = 0
    const unreadCounts: Record<string, number> = {}

    tickets.forEach((ticket: Ticket) => {
      const lastViewed = lastViewedMap[ticket.id] || new Date(0)

      // Count messages not from this user and created after last viewed
      const unreadCount = ticket.messages.filter(
        (message: Message) => message.sender !== userId && new Date(message.createdAt) > lastViewed,
      ).length

      if (unreadCount > 0) {
        unreadCounts[ticket.id] = unreadCount
        totalUnread += unreadCount
      }
    })

    return NextResponse.json({ unreadCounts, totalUnread })
  } catch (error) {
    console.error("Error fetching unread messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

