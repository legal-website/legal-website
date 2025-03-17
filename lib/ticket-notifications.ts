// Types and helper functions for ticket notifications

// Define the notification source type
export type NotificationSource = "users" | "pending" | "invoices" | "tickets" | "roles" | "system"

// Format ticket ID for better readability
export function formatTicketId(ticketId: string): string {
  // Return first 8 characters of the ID for brevity
  return ticketId.substring(0, 8)
}

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

// Get last seen tickets from localStorage
export function getLastSeenTickets(): string[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("lastSeenTickets")
  return stored ? JSON.parse(stored) : []
}

// Update last seen tickets in localStorage
export function updateLastSeenTickets(ticketIds: string[]): void {
  if (typeof window === "undefined") return

  localStorage.setItem("lastSeenTickets", JSON.stringify(ticketIds))
}

// Interface for tracking message counts per ticket
export interface TicketMessageCounts {
  [ticketId: string]: {
    count: number
    lastChecked: string
    subject: string
  }
}

// Get the stored message counts
export function getStoredMessageCounts(): TicketMessageCounts {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem("ticketMessageCounts")
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error("Error retrieving ticket message counts:", e)
    return {}
  }
}

// Update the stored message counts
export function updateStoredMessageCounts(counts: TicketMessageCounts): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("ticketMessageCounts", JSON.stringify(counts))
  } catch (e) {
    console.error("Error storing ticket message counts:", e)
  }
}

// Track tickets with new messages
export function getTicketsWithNewMessages(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem("ticketsWithNewMessages")
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error("Error retrieving tickets with new messages:", e)
    return []
  }
}

// Update tickets with new messages
export function updateTicketsWithNewMessages(ticketIds: string[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("ticketsWithNewMessages", JSON.stringify(ticketIds))
  } catch (e) {
    console.error("Error storing tickets with new messages:", e)
  }
}

// Mark a ticket as read (no new messages)
export function markTicketAsRead(ticketId: string): void {
  if (typeof window === "undefined") return

  const ticketsWithNewMessages = getTicketsWithNewMessages()
  const updatedTickets = ticketsWithNewMessages.filter((id) => id !== ticketId)
  updateTicketsWithNewMessages(updatedTickets)
}

// Ticket event notification templates
export const ticketEvents = {
  // New ticket created
  ticketCreated: (ticketId: string, subject: string) => ({
    title: "New Ticket Created",
    description: `Ticket ${formatTicketId(ticketId)}: ${subject}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // New message received
  newMessage: (ticketId: string, subject: string, sender: string) => ({
    title: "New Message",
    description: `${sender} sent a message on ticket: ${subject}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Multiple new messages
  multipleNewMessages: (count: number, ticketsCount: number) => ({
    title: "New Messages",
    description: `${count} new messages on ${ticketsCount} tickets`,
    source: "tickets" as NotificationSource,
  }),

  // Message sent
  messageSent: (ticketId: string, subject: string) => ({
    title: "Message Sent",
    description: `Your reply to ticket ${formatTicketId(ticketId)} was sent`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Status changed
  statusChanged: (ticketId: string, subject: string, status: string) => ({
    title: "Ticket Status Updated",
    description: `Ticket ${subject} status changed to ${status}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Priority changed
  priorityChanged: (ticketId: string, subject: string, priority: string) => ({
    title: "Ticket Priority Updated",
    description: `Ticket ${subject} priority changed to ${priority}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Assignee changed
  assigneeChanged: (ticketId: string, subject: string, assignee: string) => ({
    title: "Ticket Assigned",
    description: `Ticket ${subject} assigned to ${assignee}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Ticket unassigned
  unassigned: (ticketId: string, subject: string) => ({
    title: "Ticket Unassigned",
    description: `Ticket ${subject} is now unassigned`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),

  // Ticket deleted
  ticketDeleted: (ticketId: string) => ({
    title: "Ticket Deleted",
    description: `Ticket ${formatTicketId(ticketId)} has been deleted`,
    source: "tickets" as NotificationSource,
  }),

  // Ticket updated (viewed)
  ticketUpdated: (ticketId: string, subject: string) => ({
    title: "Viewing Ticket",
    description: `You are viewing ticket: ${subject}`,
    source: "tickets" as NotificationSource,
    ticketId,
  }),
}

