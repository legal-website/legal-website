export type TicketStatus = "open" | "in-progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketCategory = string

export interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  creatorId: string
  assigneeId?: string | null
  createdAt: Date
  updatedAt: Date
  creator?: {
    name?: string | null
    email: string
  }
  assignee?: {
    name?: string | null
    email: string
  } | null
  messages?: Message[]
}

export interface Message {
  id: string
  content: string
  sender: string
  senderName: string
  ticketId: string
  createdAt: Date
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  fileUrl: string
  size: string
  type: string
  messageId: string
  createdAt: Date
}

export interface CreateTicketInput {
  subject: string
  description: string
  priority: TicketPriority
  category: TicketCategory
}

export interface CreateMessageInput {
  content: string
  ticketId: string
}

export interface UpdateTicketInput {
  id: string
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string | null
}

