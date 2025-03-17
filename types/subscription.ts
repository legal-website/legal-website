export interface Subscription {
    id: string
    planId: string
    planName: string
    price: number
    billingCycle: string
    status: string
    startDate: string
    nextBillingDate: string
    createdAt?: string
    updatedAt?: string
    businessId: string
    business?: {
      id: string
      name: string
      email: string
    }
    cancellationDate?: string
    cancellationReason?: string
  }
  
  export interface SubscriptionPlan {
    id: string
    name: string
    price: number | string
    billingCycle: "monthly" | "annual" | "one-time"
    features: string[]
    description?: string
    isRecommended?: boolean
    hasAssistBadge?: boolean
    includesPackage?: string
    activeSubscribers?: number
    growth?: string
    trend?: "up" | "down"
    revenue?: string
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
    id: number | string
    name: string
    price: number
    displayPrice?: string
    description: string
    features: string[]
    isRecommended?: boolean
    includesPackage?: string
    hasAssistBadge?: boolean
    billingCycle: string
  }
  
  export interface PricingData {
    plans: PricingPlan[]
    stateFilingFees: Record<string, number>
    stateDiscounts: Record<string, number>
    stateDescriptions: Record<string, string>
  }
  
  