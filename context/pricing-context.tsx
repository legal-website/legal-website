"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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

interface PricingContextType {
  pricingData: PricingData
  loading: boolean
  error: string | null
  refreshPricingData: () => Promise<void>
  updatePricingData: (data: PricingData) => Promise<boolean>
}

// Default pricing data
const defaultPricingData: PricingData = {
  plans: [],
  stateFilingFees: {},
  stateDiscounts: {},
  stateDescriptions: {},
}

// Create the context
const PricingContext = createContext<PricingContextType | undefined>(undefined)

// Provider component
export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pricing data from the API
  const refreshPricingData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching pricing data...")
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server responded with ${response.status}`
        console.error("Error response from pricing API:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Pricing data fetched successfully")
      setPricingData(data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error fetching pricing data:", errorMessage)
      setError(`Failed to load pricing information: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update pricing data
  const updatePricingData = async (data: PricingData): Promise<boolean> => {
    try {
      setError(null)
      console.log("Updating pricing data...")

      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server responded with ${response.status}`
        console.error("Error response from pricing API:", errorMessage)
        throw new Error(errorMessage)
      }

      console.log("Pricing data updated successfully")
      setPricingData(data)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error updating pricing data:", errorMessage)
      setError(`Failed to update pricing data: ${errorMessage}`)
      return false
    }
  }

  // Fetch pricing data on initial load
  useEffect(() => {
    refreshPricingData().catch((err) => {
      console.error("Initial pricing data fetch failed:", err)
    })
  }, [])

  return (
    <PricingContext.Provider
      value={{
        pricingData,
        loading,
        error,
        refreshPricingData,
        updatePricingData,
      }}
    >
      {children}
    </PricingContext.Provider>
  )
}

// Custom hook to use the pricing context
export function usePricing() {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider")
  }
  return context
}

