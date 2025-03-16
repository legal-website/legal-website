"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import type { TicketStatus } from "@/types/ticket"

// Define the TicketView interface since it's not in the existing ticket.ts
interface TicketView {
  userId: string
  ticketId: string
  lastViewed: Date
}

// Define a type for the ticket with messages as returned by the database query
interface TicketWithMessages {
  id: string
  messages: {
    id: string
    sender: string
    createdAt: Date
  }[]
}

export async function getAllTickets(page = 1, perPage = 15) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view all tickets
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    // Get total count for pagination
    // @ts-ignore - Prisma client type issue
    const totalCount = await db.ticket.count()

    // Calculate pagination
    const skip = (page - 1) * perPage
    const take = perPage

    // @ts-ignore - Prisma client type issue
    const tickets = await db.ticket.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take,
    })

    return {
      tickets,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / perPage),
        current: page,
        perPage,
      },
    }
  } catch (error) {
    console.error("Error fetching all tickets:", error)
    return { error: "Failed to fetch tickets" }
  }
}

export async function getSupportUsers() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view support users
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const supportUsers = await db.user.findMany({
      where: {
        OR: [{ role: "ADMIN" }, { role: "SUPPORT" }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return { supportUsers }
  } catch (error) {
    console.error("Error fetching support users:", error)
    return { error: "Failed to fetch support users" }
  }
}

export async function getTicketStats() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view ticket stats
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const totalTickets = await db.ticket.count()

    // @ts-ignore - Prisma client type issue
    const openTickets = await db.ticket.count({
      where: { status: "open" as TicketStatus },
    })

    // @ts-ignore - Prisma client type issue
    const inProgressTickets = await db.ticket.count({
      where: { status: "in-progress" as TicketStatus },
    })

    // @ts-ignore - Prisma client type issue
    const resolvedTickets = await db.ticket.count({
      where: { status: "resolved" as TicketStatus },
    })

    // @ts-ignore - Prisma client type issue
    const closedTickets = await db.ticket.count({
      where: { status: "closed" as TicketStatus },
    })

    // @ts-ignore - Prisma client type issue
    const highPriorityTickets = await db.ticket.count({
      where: { priority: "high" },
    })

    // @ts-ignore - Prisma client type issue
    const urgentPriorityTickets = await db.ticket.count({
      where: { priority: "urgent" },
    })

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      highPriorityTickets,
      urgentPriorityTickets,
    }
  } catch (error) {
    console.error("Error fetching ticket stats:", error)
    return { error: "Failed to fetch ticket stats" }
  }
}

// New function to get all clients for filtering
export async function getClients() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view clients
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const clients = await db.user.findMany({
      where: {
        role: "CLIENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        business: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return { clients }
  } catch (error) {
    console.error("Error fetching clients:", error)
    return { error: "Failed to fetch clients" }
  }
}

// Improved function to get unread message counts
export async function getUnreadMessageCounts(adminId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view unread counts
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    // Get the last viewed timestamp for each ticket by this admin
    // @ts-ignore - Prisma client type issue
    const ticketViews = await db.ticketView.findMany({
      where: {
        userId: adminId,
      },
      select: {
        ticketId: true,
        lastViewed: true,
      },
    })

    // Create a map of ticket ID to last viewed timestamp
    const lastViewedMap: Record<string, Date> = {}
    ticketViews.forEach((view: { ticketId: string; lastViewed: Date }) => {
      lastViewedMap[view.ticketId] = view.lastViewed
    })

    // Get all tickets with their messages
    // @ts-ignore - Prisma client type issue
    const tickets = await db.ticket.findMany({
      select: {
        id: true,
        messages: {
          where: {
            // Messages not from this admin (i.e., from clients or other admins)
            NOT: {
              sender: adminId,
            },
          },
          select: {
            id: true,
            sender: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    // Create a map of ticket ID to unread count
    const unreadCounts: Record<string, number> = {}

    tickets.forEach((ticket: TicketWithMessages) => {
      const lastViewed = lastViewedMap[ticket.id] || new Date(0) // If never viewed, use epoch time

      // Count messages that were created after the last viewed timestamp
      const unreadMessages = ticket.messages.filter(
        (message: { id: string; sender: string; createdAt: Date }) => new Date(message.createdAt) > lastViewed,
      )

      unreadCounts[ticket.id] = unreadMessages.length
    })

    return { unreadCounts }
  } catch (error) {
    console.error("Error fetching unread message counts:", error)
    return { error: "Failed to fetch unread message counts" }
  }
}

// New function to update the last viewed timestamp for a ticket
export async function updateTicketLastViewed(ticketId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

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

    return { success: true }
  } catch (error) {
    console.error("Error updating ticket last viewed:", error)
    return { error: "Failed to update ticket last viewed" }
  }
}

