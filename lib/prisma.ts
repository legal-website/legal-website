import { PrismaClient } from "@prisma/client"

// Define global type for PrismaClient to avoid "Property does not exist" errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") global.prisma = prisma

export default prisma

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

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string | null
  userId: string
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

