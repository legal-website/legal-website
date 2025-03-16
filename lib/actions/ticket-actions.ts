"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { CreateTicketInput, CreateMessageInput, UpdateTicketInput, TicketStatus } from "@/types/ticket"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function createTicket(data: CreateTicketInput) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const ticket = await db.ticket.create({
      data: {
        subject: data.subject,
        description: data.description,
        status: "open" as TicketStatus,
        priority: data.priority,
        category: data.category,
        creatorId: session.user.id,
      },
    })

    // Create initial message from the description
    // @ts-ignore - Prisma client type issue
    await db.message.create({
      data: {
        content: data.description,
        sender: session.user.id,
        senderName: session.user.name || session.user.email || "",
        ticketId: ticket.id,
      },
    })

    revalidatePath("/dashboard/tickets")
    return { success: true, ticketId: ticket.id }
  } catch (error) {
    console.error("Error creating ticket:", error)
    return { error: "Failed to create ticket" }
  }
}

export async function getUserTickets() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const tickets = await db.ticket.findMany({
      where: {
        creatorId: session.user.id,
      },
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
    console.error("Error fetching user tickets:", error)
    return { error: "Failed to fetch tickets" }
  }
}

export async function getTicketDetails(ticketId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // @ts-ignore - Prisma client type issue
    const ticket = await db.ticket.findUnique({
      where: {
        id: ticketId,
      },
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
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!ticket) {
      return { error: "Ticket not found" }
    }

    // Check if user has access to this ticket
    const isCreator = ticket.creatorId === session.user.id
    const isAssignee = ticket.assigneeId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    const isSupport = session.user.role === "SUPPORT"

    if (!isCreator && !isAssignee && !isAdmin && !isSupport) {
      return { error: "Unauthorized" }
    }

    return { ticket }
  } catch (error) {
    console.error("Error fetching ticket details:", error)
    return { error: "Failed to fetch ticket details" }
  }
}

export async function createMessage(data: CreateMessageInput, files?: File[]) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if ticket exists and user has access
    // @ts-ignore - Prisma client type issue
    const ticket = await db.ticket.findUnique({
      where: {
        id: data.ticketId,
      },
    })

    if (!ticket) {
      return { error: "Ticket not found" }
    }

    const isCreator = ticket.creatorId === session.user.id
    const isAssignee = ticket.assigneeId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    const isSupport = session.user.role === "SUPPORT"

    if (!isCreator && !isAssignee && !isAdmin && !isSupport) {
      return { error: "Unauthorized" }
    }

    // Create message
    // @ts-ignore - Prisma client type issue
    const message = await db.message.create({
      data: {
        content: data.content,
        sender: session.user.id,
        senderName: session.user.name || session.user.email || "",
        ticketId: data.ticketId,
      },
    })

    // If ticket was resolved or closed, reopen it when client responds
    if ((ticket.status === "resolved" || ticket.status === "closed") && isCreator) {
      // @ts-ignore - Prisma client type issue
      await db.ticket.update({
        where: {
          id: data.ticketId,
        },
        data: {
          status: "open" as TicketStatus,
          updatedAt: new Date(),
        },
      })
    } else {
      // Update ticket's updatedAt timestamp
      // @ts-ignore - Prisma client type issue
      await db.ticket.update({
        where: {
          id: data.ticketId,
        },
        data: {
          updatedAt: new Date(),
        },
      })
    }

    // Handle file uploads if any
    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = await uploadToCloudinary(file)

        // @ts-ignore - Prisma client type issue
        await db.attachment.create({
          data: {
            name: file.name,
            fileUrl,
            size: `${Math.round(file.size / 1024)} KB`,
            type: file.type,
            messageId: message.id,
          },
        })
      }
    }

    revalidatePath(`/dashboard/tickets`)
    revalidatePath(`/admin/tickets`)

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error("Error creating message:", error)
    return { error: "Failed to create message" }
  }
}

export async function updateTicket(data: UpdateTicketInput) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin and support can update tickets
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { error: "Unauthorized" }
  }

  try {
    const updateData: any = {}

    if (data.status) updateData.status = data.status
    if (data.priority) updateData.priority = data.priority
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId

    // @ts-ignore - Prisma client type issue
    const ticket = await db.ticket.update({
      where: {
        id: data.id,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    // If status changed, add a system message
    if (data.status) {
      // @ts-ignore - Prisma client type issue
      await db.message.create({
        data: {
          content: `Ticket status changed to ${data.status}`,
          sender: "system",
          senderName: "System",
          ticketId: data.id,
        },
      })
    }

    // If assignee changed, add a system message
    if (data.assigneeId !== undefined) {
      // @ts-ignore - Prisma client type issue
      const assignee = data.assigneeId ? await db.user.findUnique({ where: { id: data.assigneeId } }) : null

      const assigneeName = assignee ? assignee.name || assignee.email : "Unassigned"

      // @ts-ignore - Prisma client type issue
      await db.message.create({
        data: {
          content: `Ticket assigned to ${assigneeName}`,
          sender: "system",
          senderName: "System",
          ticketId: data.id,
        },
      })
    }

    revalidatePath(`/admin/tickets`)
    revalidatePath(`/dashboard/tickets`)

    return { success: true, ticketId: ticket.id }
  } catch (error) {
    console.error("Error updating ticket:", error)
    return { error: "Failed to update ticket" }
  }
}

export async function deleteTicket(ticketId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if user is the creator or an admin
    // @ts-ignore - Prisma client type issue
    const ticket = await db.ticket.findUnique({
      where: {
        id: ticketId,
      },
    })

    if (!ticket) {
      return { error: "Ticket not found" }
    }

    const isCreator = ticket.creatorId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isCreator && !isAdmin) {
      return { error: "Unauthorized" }
    }

    // Delete all messages and attachments first
    // @ts-ignore - Prisma client type issue
    const messages = await db.message.findMany({
      where: {
        ticketId,
      },
      include: {
        attachments: true,
      },
    })

    for (const message of messages) {
      if (message.attachments.length > 0) {
        // @ts-ignore - Prisma client type issue
        await db.attachment.deleteMany({
          where: {
            messageId: message.id,
          },
        })
      }
    }

    // @ts-ignore - Prisma client type issue
    await db.message.deleteMany({
      where: {
        ticketId,
      },
    })

    // Delete the ticket
    // @ts-ignore - Prisma client type issue
    await db.ticket.delete({
      where: {
        id: ticketId,
      },
    })

    revalidatePath("/dashboard/tickets")
    revalidatePath("/admin/tickets")

    return { success: true }
  } catch (error) {
    console.error("Error deleting ticket:", error)
    return { error: "Failed to delete ticket" }
  }
}

