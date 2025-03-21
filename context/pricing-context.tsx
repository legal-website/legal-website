"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface PricingPlan {
  id: number
  name: string
  price: number
  displayPrice: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended: boolean
  includesPackage: string
  hasAssistBadge: boolean
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
  plans: PricingPlan[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
  _version?: number
}

interface PricingContextType {
  pricingData: PricingData
  loading: boolean
  error: string | null
  refreshPricingData: () => Promise<void>
  updatePricingData: (data: PricingData) => Promise<boolean>
  lastUpdated: Date | null
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch pricing data from the API
  const refreshPricingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add timestamp and random value to prevent caching
      const timestamp = new Date().getTime()
      const random = Math.random().toString(36).substring(2, 15)
      console.log(`Fetching pricing data... (t=${timestamp}, r=${random})`)

      const response = await fetch(`/api/pricing?t=${timestamp}&r=${random}&noCache=true`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server responded with ${response.status}`
        console.error("Error response from pricing API:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Pricing data fetched successfully:", {
        version: data._version,
        planCount: data.plans?.length,
        stateCount: Object.keys(data.stateFilingFees || {}).length,
        plans: data.plans?.map((p: PricingPlan) => `${p.name}: $${p.price}`).join(", "),
      })

      // Log features for each plan to debug
      if (data.plans && Array.isArray(data.plans)) {
        data.plans.forEach((plan: PricingPlan) => {
          console.log(`${plan.name} features (${plan.features?.length || 0}):`, plan.features?.join(", ") || "None")
        })
      }

      // Ensure we have a complete data structure
      const completeData: PricingData = {
        plans: data.plans || [],
        stateFilingFees: data.stateFilingFees || {},
        stateDiscounts: data.stateDiscounts || {},
        stateDescriptions: data.stateDescriptions || {},
        _version: data._version || 0,
      }

      // Make sure all plans have the required properties
      completeData.plans = completeData.plans.map((plan) => ({
        ...plan,
        isRecommended: plan.isRecommended === undefined ? false : plan.isRecommended,
        includesPackage: plan.includesPackage || "",
        hasAssistBadge: plan.hasAssistBadge === undefined ? false : plan.hasAssistBadge,
      }))

      setPricingData(completeData)
      setLastUpdated(new Date())
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
      console.log("Updating pricing data...", {
        version: data._version,
        planCount: data.plans?.length,
        stateCount: Object.keys(data.stateFilingFees || {}).length,
        plans: data.plans?.map((p) => `${p.name}: $${p.price}`).join(", "),
      })

      // Create a deep copy to ensure we're not modifying the original object
      const dataToSend = JSON.parse(JSON.stringify(data))

      // Preserve the version from the current data
      dataToSend._version = pricingData._version || 0

      // Make sure all plans have the required properties
      dataToSend.plans = dataToSend.plans.map((plan: PricingPlan) => ({
        ...plan,
        isRecommended: plan.isRecommended === undefined ? false : plan.isRecommended,
        includesPackage: plan.includesPackage || "",
        hasAssistBadge: plan.hasAssistBadge === undefined ? false : plan.hasAssistBadge,
      }))

      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.status === 409) {
        // Version conflict - need to refresh and try again
        const errorData = await response.json()
        console.error("Version conflict:", errorData)
        setError("Your data is out of date. The page will refresh with the latest data. Please try again.")

        // Refresh data and return failure
        await refreshPricingData()
        return false
      }

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`
            }
          }
        } catch (e) {
          // If we can't parse the JSON, just use the status code message
        }

        console.error("Error response from pricing API:", errorMessage)
        throw new Error(errorMessage)
      }

      // Get the response data with new version
      const responseData = await response.json()
      console.log("Pricing data updated successfully", responseData)

      // Update local state with the new version
      if (responseData.version) {
        setPricingData((prevData) => ({
          ...prevData,
          _version: responseData.version,
        }))
      }

      setLastUpdated(new Date())

      // Refresh data from server to ensure we have the latest
      // Add a small delay to ensure the database has time to update
      setTimeout(() => {
        refreshPricingData().catch((err) => {
          console.error("Refresh after update failed:", err)
        })
      }, 500)

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

    // Set up periodic refresh to ensure data is current
    const intervalId = setInterval(
      () => {
        console.log("Performing periodic refresh of pricing data")
        refreshPricingData().catch((err) => {
          console.error("Periodic pricing data refresh failed:", err)
        })
      },
      5 * 60 * 1000,
    ) // Refresh every 5 minutes

    return () => clearInterval(intervalId)
  }, [])

  return (
    <PricingContext.Provider
      value={{
        pricingData,
        loading,
        error,
        refreshPricingData,
        updatePricingData,
        lastUpdated,
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

