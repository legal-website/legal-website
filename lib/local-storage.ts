// Helper functions for managing ticket data in localStorage

// Get tickets with new messages
export function getTicketsWithNewMessages(): string[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("ticketsWithNewMessages")
  return stored ? JSON.parse(stored) : []
}

// Update tickets with new messages
export function updateTicketsWithNewMessages(ticketIds: string[]): void {
  if (typeof window === "undefined") return

  localStorage.setItem("ticketsWithNewMessages", JSON.stringify(ticketIds))
}

// Mark a ticket as read (no new messages)
export function markTicketAsRead(ticketId: string): void {
  if (typeof window === "undefined") return

  const tickets = getTicketsWithNewMessages()
  const updatedTickets = tickets.filter((id) => id !== ticketId)
  updateTicketsWithNewMessages(updatedTickets)
}

// Get stored message counts
export function getStoredMessageCounts(): Record<string, { count: number; lastChecked: string; subject: string }> {
  if (typeof window === "undefined") return {}

  const stored = localStorage.getItem("ticketMessageCounts")
  return stored ? JSON.parse(stored) : {}
}

// Update stored message counts
export function updateStoredMessageCounts(
  counts: Record<string, { count: number; lastChecked: string; subject: string }>,
): void {
  if (typeof window === "undefined") return

  localStorage.setItem("ticketMessageCounts", JSON.stringify(counts))
}

