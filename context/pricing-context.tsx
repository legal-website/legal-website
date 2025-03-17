export interface PricingData {
  plans: {
    id: number
    name: string
    price: number
    displayPrice: string
    billingCycle: string
    description: string
    features: string[]
    isRecommended?: boolean
    includesPackage?: string
    hasAssistBadge?: boolean
  }[]
  stateFilingFees: {
    [state: string]: number
  }
  stateDiscounts: {
    [state: string]: number
  }
  stateDescriptions: {
    [state: string]: string
  }
}

