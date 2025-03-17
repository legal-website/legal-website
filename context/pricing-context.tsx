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

const PricingContext = createContext<PricingContextType | undefined>(undefined)

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })
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
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setError("Failed to load pricing information")
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

export function usePricing() {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider")
  }
  return context
}

