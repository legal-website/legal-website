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
  
  // Define the source type to match the Notification interface
  type NotificationSource = "users" | "pending" | "invoices" | "tickets" | "roles" | "system"
  
  // Simple notification events for tickets
  export const ticketEvents = {
    // New message in a ticket
    newMessage: (ticketId: string, subject: string, sender: string) => ({
      title: "New Message",
      description: `New message from ${sender} in ticket: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Multiple new messages
    multipleNewMessages: (count: number, ticketsCount: number) => ({
      title: "New Messages",
      description: `You have ${count} new messages in ${ticketsCount} ticket${ticketsCount > 1 ? "s" : ""}`,
      source: "tickets" as NotificationSource,
    }),
  
    // Ticket created
    ticketCreated: (ticketId: string, subject: string) => ({
      title: "New Ticket",
      description: `New ticket created: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Message sent
    messageSent: (ticketId: string, subject: string) => ({
      title: "Message Sent",
      description: `Message sent in ticket: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Status changed
    statusChanged: (ticketId: string, subject: string, status: string) => ({
      title: "Status Changed",
      description: `Ticket status changed to ${status}: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Priority changed
    priorityChanged: (ticketId: string, subject: string, priority: string) => ({
      title: "Priority Changed",
      description: `Ticket priority changed to ${priority}: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Assignee changed
    assigneeChanged: (ticketId: string, subject: string, assignee: string) => ({
      title: "Assignee Changed",
      description: `Ticket assigned to ${assignee}: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Unassigned
    unassigned: (ticketId: string, subject: string) => ({
      title: "Ticket Unassigned",
      description: `Ticket unassigned: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  
    // Ticket deleted
    ticketDeleted: (ticketId: string) => ({
      title: "Ticket Deleted",
      description: `Ticket #${formatTicketId(ticketId)} has been deleted`,
      source: "tickets" as NotificationSource,
    }),
  
    // Ticket updated
    ticketUpdated: (ticketId: string, subject: string) => ({
      title: "Ticket Updated",
      description: `Ticket updated: ${subject.substring(0, 30)}${subject.length > 30 ? "..." : ""}`,
      source: "tickets" as NotificationSource,
      ticketId,
    }),
  }
  
  // Store the last seen tickets in localStorage
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
  
  