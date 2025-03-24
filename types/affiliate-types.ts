// Define the affiliate conversion status enum
export enum AffiliateConversionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PAID = "PAID",
  }
  
  // Define the affiliate payout status enum
  export enum AffiliatePayoutStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED",
  }
  
  // Define the affiliate link interface
  export interface AffiliateLink {
    id: string
    userId: string
    code: string
    createdAt: Date
    updatedAt: Date
  }
  
  // Define the affiliate conversion interface
  export interface AffiliateConversion {
    id: string
    linkId: string
    orderId: string
    amount: number
    commission: number
    status: AffiliateConversionStatus
    metadata?: string
    createdAt: Date
    updatedAt: Date
  }
  
  // Define the affiliate payout interface
  export interface AffiliatePayout {
    id: string
    userId: string
    amount: number
    method: string
    status: AffiliatePayoutStatus
    notes?: string | null
    adminNotes?: string | null
    processed?: boolean
    createdAt: Date
    updatedAt: Date
  }
  
  // Define the affiliate settings interface
  export interface AffiliateSettings {
    id: number
    commissionRate: number
    minPayoutAmount: number
    cookieDuration: number
    updatedAt: Date
  }
  
  