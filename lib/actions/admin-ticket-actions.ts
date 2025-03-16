"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function getAllTickets() {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view all tickets
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
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
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view support users
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
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
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can view ticket stats
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    const totalTickets = await db.ticket.count()

    const openTickets = await db.ticket.count({
      where: {
        status: "open",
      },
    })

    const inProgressTickets = await db.ticket.count({
      where: {
        status: "in-progress",
      },
    })

    const resolvedTickets = await db.ticket.count({
      where: {
        status: "resolved",
      },
    })

    const closedTickets = await db.ticket.count({
      where: {
        status: "closed",
      },
    })

    const highPriorityTickets = await db.ticket.count({
      where: {
        priority: "high",
      },
    })

    const urgentPriorityTickets = await db.ticket.count({
      where: {
        priority: "urgent",
      },
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

