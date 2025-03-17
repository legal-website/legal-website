// Re-export functions from ticket-notifications.ts to maintain compatibility
import {
  getTicketsWithNewMessages,
  updateTicketsWithNewMessages,
  markTicketAsRead,
  getStoredMessageCounts,
  updateStoredMessageCounts,
} from "./ticket-notifications"

export {
  getTicketsWithNewMessages,
  updateTicketsWithNewMessages,
  markTicketAsRead,
  getStoredMessageCounts,
  updateStoredMessageCounts,
}

