// Define simple interfaces that match your Prisma schema
export interface User {
  id: string
  email: string
  name: string | null
  password: string
  role: Role
  createdAt: Date
  updatedAt: Date
  businessId: string | null
}

export interface Business {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  industry: string | null
  formationDate: Date | null
  ein: string | null
  businessId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  price: number
  billingCycle: string
  status: string
  startDate: Date
  nextBillingDate: Date
  businessId: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  name: string
  type: string
  category: string
  fileUrl: string
  businessId: string
  createdAt: Date
  updatedAt: Date
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  creatorId: string
  assigneeId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  content: string
  sender: string
  senderName: string
  ticketId: string
  createdAt: Date
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

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

// Role type based on the enum in schema.prisma
export type Role = "ADMIN" | "SUPPORT" | "CLIENT"

