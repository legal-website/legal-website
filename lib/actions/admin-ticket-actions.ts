"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import type { TicketStatus } from "@/types/ticket"

export async function getAllTickets() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view all tickets
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
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
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return { tickets }
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

