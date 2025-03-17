export interface Business {
  id: string
  name: string
  email: string
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  price: number
  billingCycle: "monthly" | "annual" | "one-time"
  status: "active" | "past_due" | "canceled" | "pending"
  startDate: string
  nextBillingDate: string
  createdAt?: string
  updatedAt?: string
  businessId: string
  business?: Business
  cancellationReason?: string
  cancellationDate?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number | string // Allow both number and string for price
  billingCycle: "monthly" | "annual" | "one-time"
  features: string[]
  description: string
  isRecommended?: boolean
  hasAssistBadge?: boolean
  includesPackage?: string
  activeSubscribers?: number
  revenue?: string
  growth?: string
  trend?: "up" | "down"
}

export interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  canceledSubscriptions: number
  monthlyRecurringRevenue: number
  annualRecurringRevenue: number
  totalRevenue: number
}

export interface PricingPlan {
  id: number | string // Allow both number and string for id
  name: string
  price: number
  displayPrice?: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended: boolean
  includesPackage: string
  hasAssistBadge: boolean
}

export interface PricingData {
  plans: PricingPlan[]
  stateFilingFees: Record<string, number>
  stateDiscounts: Record<string, number>
  stateDescriptions: Record<string, string>
}

