import type { PrismaClient } from "@prisma/client"

// Define invoice item interface to help with template identification
export interface InvoiceItem {
  id?: string
  tier?: string
  price?: number
  stateFee?: number
  state?: string
  discount?: number
  templateId?: string
  type?: string
}

// Instead of extending PrismaClient directly, we'll use declaration merging
// This avoids the need to manually define all methods for each model
declare global {
  namespace PrismaJson {
    interface PhoneNumberRequestModel {
      id: string
      userId: string
      phoneNumber?: string | null
      status: string
      createdAt: Date
      updatedAt: Date
    }
  }
}

// Use type assertion to extend PrismaClient without TypeScript errors
export type ExtendedPrismaClient = PrismaClient

