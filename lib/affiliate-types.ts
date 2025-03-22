import type { Decimal } from "@prisma/client/runtime/library"

// Extend the base AffiliateLink model with our additional properties
export interface AffiliateLinkWithCommission {
  id: string
  userId: string
  code: string
  createdAt: Date
  updatedAt: Date
  active: boolean
  commission: Decimal | number
}

export enum AffiliateConversionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export interface AffiliateConversionWithRelations {
  id: string
  linkId: string
  orderId: string
  amount: Decimal
  commission: Decimal
  status: string
  createdAt: Date
  updatedAt: Date
  customerEmail?: string | null
  link?: {
    user: {
      email: string
    }
  }
}

