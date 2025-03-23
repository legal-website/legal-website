import type { Decimal } from "@prisma/client/runtime/library"

// Define enums for affiliate statuses
export enum AffiliateConversionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export enum AffiliatePayoutStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// Define interfaces for affiliate models
export interface AffiliateStats {
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalEarnings: Decimal | number
  pendingEarnings: Decimal | number
  paidEarnings: Decimal | number
  clicksThisMonth: number
  conversionsThisMonth: number
  earningsThisMonth: Decimal | number
}

export interface AffiliateAdminStats {
  totalAffiliates: number
  activeAffiliates: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalCommissions: Decimal | number
  pendingCommissions: Decimal | number
  paidCommissions: Decimal | number
  clicksThisMonth: number
  conversionsThisMonth: number
  commissionsThisMonth: Decimal | number
}

