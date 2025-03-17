import type { Notification } from "@/components/admin/header"

// Function to format time difference
export function formatTimeDifference(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }
}

// Format ticket ID for better readability
export function formatTicketId(ticketId: string): string {
  // Return first 8 characters of the ID for brevity
  return ticketId.substring(0, 8)
}

// Ticket-related notification events
export const ticketEvents = {
  ticketCreated: (ticketId: string, subject: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "New Ticket Created",
    description: `Ticket #${formatTicketId(ticketId)}: ${subject}`,
    source: "tickets",
  }),

  ticketUpdated: (ticketId: string, subject: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Viewed",
    description: `You viewed ticket #${formatTicketId(ticketId)}: ${subject}`,
    source: "tickets",
  }),

  statusChanged: (ticketId: string, subject: string, status: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Status Updated",
    description: `Ticket #${formatTicketId(ticketId)} status changed to ${status}`,
    source: "tickets",
  }),

  priorityChanged: (
    ticketId: string,
    subject: string,
    priority: string,
  ): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Priority Updated",
    description: `Ticket #${formatTicketId(ticketId)} priority changed to ${priority}`,
    source: "tickets",
  }),

  assigneeChanged: (
    ticketId: string,
    subject: string,
    assigneeName: string,
  ): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Assigned",
    description: `Ticket #${formatTicketId(ticketId)} assigned to ${assigneeName}`,
    source: "tickets",
  }),

  unassigned: (ticketId: string, subject: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Unassigned",
    description: `Ticket #${formatTicketId(ticketId)} has been unassigned`,
    source: "tickets",
  }),

  messageSent: (ticketId: string, subject: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Message Sent",
    description: `You sent a message in ticket #${formatTicketId(ticketId)}`,
    source: "tickets",
  }),

  newMessage: (ticketId: string, subject: string, senderName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "New Message Received",
    description: `${senderName} sent a message in ticket #${formatTicketId(ticketId)}`,
    source: "tickets",
  }),

  multipleNewMessages: (messageCount: number, ticketCount: number): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Multiple New Messages",
    description: `${messageCount} new message${messageCount > 1 ? "s" : ""} in ${ticketCount} ticket${ticketCount > 1 ? "s" : ""}`,
    source: "tickets",
  }),

  ticketDeleted: (ticketId: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Ticket Deleted",
    description: `Ticket #${formatTicketId(ticketId)} has been deleted`,
    source: "tickets",
  }),
}

// Store the IDs of tickets we've already seen to detect new ones
export const getLastSeenTickets = (): string[] => {
  try {
    const stored = localStorage.getItem("lastSeenTickets")
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error("Error retrieving last seen tickets:", e)
    return []
  }
}

export const updateLastSeenTickets = (ticketIds: string[]) => {
  try {
    localStorage.setItem("lastSeenTickets", JSON.stringify(ticketIds))
  } catch (e) {
    console.error("Error storing last seen tickets:", e)
  }
}

// New functions to track message counts

// Interface for tracking message counts per ticket
export interface TicketMessageCounts {
  [ticketId: string]: {
    count: number
    lastChecked: string
    subject: string
  }
}

// Get the stored message counts
export const getStoredMessageCounts = (): TicketMessageCounts => {
  try {
    const stored = localStorage.getItem("ticketMessageCounts")
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error("Error retrieving ticket message counts:", e)
    return {}
  }
}

// Update the stored message counts
export const updateStoredMessageCounts = (counts: TicketMessageCounts) => {
  try {
    localStorage.setItem("ticketMessageCounts", JSON.stringify(counts))
  } catch (e) {
    console.error("Error storing ticket message counts:", e)
  }
}

// Track tickets with new messages
export const getTicketsWithNewMessages = (): string[] => {
  try {
    const stored = localStorage.getItem("ticketsWithNewMessages")
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error("Error retrieving tickets with new messages:", e)
    return []
  }
}

export const updateTicketsWithNewMessages = (ticketIds: string[]) => {
  try {
    localStorage.setItem("ticketsWithNewMessages", JSON.stringify(ticketIds))
  } catch (e) {
    console.error("Error storing tickets with new messages:", e)
  }
}

// Mark a ticket as read (no new messages)
export const markTicketAsRead = (ticketId: string) => {
  const ticketsWithNewMessages = getTicketsWithNewMessages()
  const updatedTickets = ticketsWithNewMessages.filter((id) => id !== ticketId)
  updateTicketsWithNewMessages(updatedTickets)
}

