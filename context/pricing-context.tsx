"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { PricingData } from "@/types/subscription"

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
    // ... other states
  },
  stateDiscounts: {
    "New Mexico": 40,
    Wyoming: 80,
    // ... other states
  },
  stateDescriptions: {
    Alabama: "Annual Report: $50 (10th April)",
    Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
    // ... other states
  },
}

// Create context
interface PricingContextType {
  pricingData: PricingData
  setPricingData: React.Dispatch<React.SetStateAction<PricingData>>
  savePricingData: () => Promise<void>
  refreshPricingData: () => Promise<void>
  loading: boolean
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

// Provider component
export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [loading, setLoading] = useState(false)

  // Fetch pricing data on mount
  useEffect(() => {
    refreshPricingData()
  }, [])

  // Refresh pricing data from API
  const refreshPricingData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/pricing")
      if (!response.ok) {
        throw new Error("Failed to fetch pricing data")
      }
      const data = await response.json()
      setPricingData(data)
    } catch (error) {
      console.error("Error fetching pricing data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Save pricing data to API
  const savePricingData = async () => {
    try {
      setLoading(true)
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
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <PricingContext.Provider value={{ pricingData, setPricingData, savePricingData, refreshPricingData, loading }}>
      {children}
    </PricingContext.Provider>
  )
}

// Hook for using the pricing context
export function usePricing() {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider")
  }
  return context
}

