// Affiliate conversion status enum
export enum AffiliateConversionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

// Affiliate payout status enum
export enum AffiliatePayoutStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// Affiliate link model
export interface AffiliateLink {
  id: string
  userId: string
  code: string
  createdAt: Date
  updatedAt: Date
  user?: any
  clicks?: AffiliateClick[]
  conversions?: AffiliateConversion[]
}

// Affiliate click model
export interface AffiliateClick {
  id: string
  linkId: string
  ipAddress?: string | null
  userAgent?: string | null
  referrer?: string | null
  createdAt: Date
  link?: AffiliateLink
}

// Affiliate conversion model
export interface AffiliateConversion {
  id: string
  linkId: string
  orderId: string
  amount: number
  commission: number
  status: AffiliateConversionStatus
  createdAt: Date
  updatedAt: Date
  link?: AffiliateLink
}

// Affiliate payout model
export interface AffiliatePayout {
  id: string
  userId: string
  amount: number
  method: string
  status: AffiliatePayoutStatus
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  user?: any
}

// Affiliate settings model
export interface AffiliateSettings {
  id: number
  commissionRate: number
  minPayoutAmount: number
  cookieDuration: number
  updatedAt: Date
}

