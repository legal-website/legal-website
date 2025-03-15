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

// This is a workaround for TypeScript not recognizing the new models
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

    interface AccountManagerRequestModel {
      id: string
      userId: string
      status: string
      managerName?: string | null
      contactLink?: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
}

// Use type assertion instead of interface extension
export type ExtendedPrismaClient = PrismaClient

