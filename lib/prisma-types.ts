// lib/prisma-types.ts
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

    // Add new model interfaces
    interface DocumentModel {
      id: string
      name: string
      description?: string | null
      category: string
      type: string
      size: string
      fileUrl: string
      isPermanent: boolean
      businessId: string
      uploadedById: string
      createdAt: Date
      updatedAt: Date
    }

    interface DocumentSharingModel {
      id: string
      documentId: string
      sharedWithEmail: string
      sharedById: string
      accessExpires?: Date | null
      createdAt: Date
      updatedAt: Date
    }

    interface DocumentActivityModel {
      id: string
      action: string
      documentId?: string | null
      userId?: string | null
      businessId: string
      details?: string | null
      createdAt: Date
    }

    interface BusinessStorageModel {
      id: string
      businessId: string
      totalStorageBytes: number
      storageLimit: number
      createdAt: Date
      updatedAt: Date
    }
  }
}

// Use type assertion instead of interface extension
export type ExtendedPrismaClient = PrismaClient