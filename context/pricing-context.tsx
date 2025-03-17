"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define types for our pricing data
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

interface PricingContextType {
  pricingData: PricingData
  setPricingData: React.Dispatch<React.SetStateAction<PricingData>>
  savePricingData: () => Promise<void>
  refreshPricingData: () => Promise<void>
  loading: boolean
  error: string | null
}

const defaultPricingData: PricingData = {
  plans: [],
  stateFilingFees: {},
  stateDiscounts: {},
  stateDescriptions: {},
}

const PricingContext = createContext<PricingContextType>({
  pricingData: defaultPricingData,
  setPricingData: () => {},
  savePricingData: async () => {},
  refreshPricingData: async () => {},
  loading: false,
  error: null,
})

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        throw new Error("Failed to fetch pricing data")
      }

      const data = await response.json()
      setPricingData(data)
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setError("Failed to load pricing information")
    } finally {
      setLoading(false)
    }
  }

  const savePricingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricingData),
      })

      if (!response.ok) {
        throw new Error("Failed to save pricing data")
      }
    } catch (error) {
      console.error("Error saving pricing data:", error)
      setError("Failed to save pricing information")
      throw error
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
        setPricingData,
        savePricingData,
        refreshPricingData: fetchPricingData,
        loading,
        error,
      }}
    >
      {children}
    </PricingContext.Provider>
  )
}

export const usePricing = () => useContext(PricingContext)

