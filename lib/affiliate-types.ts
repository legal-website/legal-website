// Enum for affiliate conversion status
export enum AffiliateConversionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

// Enum for affiliate payout status
export enum AffiliatePayoutStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// Interface for affiliate stats
export interface AffiliateStats {
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  rejectedEarnings: number
}

// Interface for affiliate link with stats
export interface AffiliateLinkWithStats {
  id: string
  code: string
  url: string
  clicks: number
  conversions: number
  conversionRate: number
  earnings: number
}

