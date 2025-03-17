"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface PricingTier {
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

export interface StateFilingFees {
  [state: string]: number
}

export interface StateDiscounts {
  [state: string]: number
}

export interface StateDescriptions {
  [state: string]: string
}

export interface PricingData {
  plans: PricingTier[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
}

interface PricingContextType {
  pricingData: PricingData
  loading: boolean
  error: string | null
  refreshPricingData: () => Promise<void>
}

const defaultPricingData: PricingData = {
  plans: [],
  stateFilingFees: {},
  stateDiscounts: {},
  stateDescriptions: {},
}

const PricingContext = createContext<PricingContextType>({
  pricingData: defaultPricingData,
  loading: true,
  error: null,
  refreshPricingData: async () => {},
})

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        throw new Error("Failed to fetch pricing data")
      }

      const data = await response.json()
      setPricingData(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching pricing data:", err)
      setError("Failed to load pricing data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
  }, [])

  return (
    <PricingContext.Provider
      value={{
        pricingData,
        loading,
        error,
        refreshPricingData: fetchPricingData,
      }}
    >
      {children}
    </PricingContext.Provider>
  )
}

export const usePricing = () => useContext(PricingContext)

