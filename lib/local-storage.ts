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
  
  