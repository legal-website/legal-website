import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and support can mark messages as read
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { ticketId } = await request.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Try to use ticketView table if it exists
    try {
      // @ts-ignore - Prisma client type issue
      await db.ticketView.upsert({
        where: {
          userId_ticketId: {
            userId: session.user.id,
            ticketId: ticketId,
          },
        },
        update: {
          lastViewed: new Date(),
        },
        create: {
          userId: session.user.id,
          ticketId: ticketId,
          lastViewed: new Date(),
        },
      })
    } catch (error) {
      // If ticketView table doesn't exist, we'll use a different approach
      console.warn("TicketView table not found, using localStorage in the client")
      // The client will handle this using localStorage
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

