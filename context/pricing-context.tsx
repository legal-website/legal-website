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

// Create the context with a default value
const PricingContext = createContext<PricingContextType | undefined>(undefined)

// Default pricing data
const defaultPricingData: PricingData = {
  plans: [
    {
      id: 1,
      name: "STARTER",
      price: 129,
      displayPrice: "$129",
      billingCycle: "one-time",
      description: "Includes the filing of Articles of Org to officially establish and Orizenly recognize your (LLC).",
      features: [
        "Company Formation",
        "Registered Agent",
        "Ein (Tax ID)",
        "Operating Agreement",
        "FinCEN BOI",
        "Standard Address",
        "Lifetime Support",
        "Company Alerts",
        "Dedicated Dashboard",
      ],
      isRecommended: false,
      includesPackage: "",
      hasAssistBadge: false,
    },
    {
      id: 2,
      name: "STANDARD",
      price: 199,
      displayPrice: "$199",
      billingCycle: "one-time",
      description: "Best for those planning to start and operate a business or side hustle.",
      features: [
        "Company Formation",
        "Registered Agent",
        "Ein (Tax ID)",
        "Operating Agreement",
        "FinCEN BOI",
        "Standard Address",
        "Business Bank Account",
        "Priority Support",
        "Company Alerts",
        "Dedicated Dashboard",
      ],
      isRecommended: true,
      includesPackage: "Basic",
      hasAssistBadge: false,
    },
    {
      id: 3,
      name: "Premium",
      price: 249,
      displayPrice: "$249",
      billingCycle: "one-time",
      description: "Best for those who want an experienced attorney to ensure they get everything right.",
      features: [
        "Company Formation",
        "Registered Agent",
        "Ein (Tax ID)",
        "Operating Agreement",
        "FinCEN BOI",
        "Unique Address",
        "Business Bank Account",
        "Priority Support",
        "Payment Gateway Setup",
        "Free Business Website",
        "Dedicated Dashboard",
        "Free Annual Report(1yr)",
        "Free .Com Domain",
      ],
      isRecommended: false,
      includesPackage: "Pro",
      hasAssistBadge: true,
    },
  ],
  stateFilingFees: {
    Alabama: 230,
    Alaska: 250,
    // Other states will be loaded from the API
  },
  stateDiscounts: {
    "New Mexico": 40,
    Wyoming: 80,
    // Other discounts will be loaded from the API
  },
  stateDescriptions: {
    Alabama: "Annual Report: $50 (10th April)",
    Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
    // Other descriptions will be loaded from the API
  },
}

// Provider component
export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pricing data on component mount
  useEffect(() => {
    refreshPricingData()
  }, [])

  // Function to refresh pricing data from the API
  const refreshPricingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        throw new Error(`Failed to fetch pricing data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Ensure we have all the required properties
      const validatedData: PricingData = {
        plans: Array.isArray(data.plans) ? data.plans : defaultPricingData.plans,
        stateFilingFees: data.stateFilingFees || defaultPricingData.stateFilingFees,
        stateDiscounts: data.stateDiscounts || defaultPricingData.stateDiscounts,
        stateDescriptions: data.stateDescriptions || defaultPricingData.stateDescriptions,
      }

      setPricingData(validatedData)
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setError(error instanceof Error ? error.message : "Failed to load pricing data")
    } finally {
      setLoading(false)
    }
  }

  // Function to save pricing data to the API
  const savePricingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Ensure displayPrice is set for each plan
      const updatedPlans = pricingData.plans.map((plan) => ({
        ...plan,
        displayPrice: plan.displayPrice || `$${plan.price}`,
      }))

      const dataToSave = {
        ...pricingData,
        plans: updatedPlans,
      }

      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to save pricing data: ${response.status}`)
      }

      // Update local state with the saved data
      setPricingData(dataToSave)
    } catch (error) {
      console.error("Error saving pricing data:", error)
      setError(error instanceof Error ? error.message : "Failed to save pricing data")
      throw error // Re-throw to allow handling in the component
    } finally {
      setLoading(false)
    }
  }

  return (
    <PricingContext.Provider
      value={{
        pricingData,
        setPricingData,
        savePricingData,
        refreshPricingData,
        loading,
        error,
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

