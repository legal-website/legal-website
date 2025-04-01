"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, ShieldCheck, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ScrollAnimation } from "./GlobalScrollAnimation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"

// Define types for our data

interface PricingTier {
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

interface StateFilingFees {
  [state: string]: number
}

interface StateDiscounts {
  [state: string]: number
}

interface StateDescriptions {
  [state: string]: string
}

interface PricingData {
  plans: PricingTier[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
}

export default function PricingCards() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedState, setSelectedState] = useState<string>("")
  const { addItem, isInCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for pricing data
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })

  // Fetch pricing data from the API
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/pricing")

        if (!response.ok) {
          throw new Error("Failed to fetch pricing data")
        }

        const data = await response.json()

        // Ensure we have all states data
        if (Object.keys(data.stateFilingFees || {}).length < 50) {
          // If we're missing states, add the complete state data
          const completeStateData = {
            ...data,
            stateFilingFees: {
              Alabama: 230,
              Alaska: 250,
              Arizona: 50,
              Arkansas: 45,
              California: 70,
              Colorado: 50,
              Connecticut: 120,
              Delaware: 90,
              Florida: 125,
              Georgia: 100,
              Hawaii: 50,
              Idaho: 100,
              Illinois: 150,
              Indiana: 95,
              Iowa: 50,
              Kansas: 160,
              Kentucky: 40,
              Louisiana: 100,
              Maine: 175,
              Maryland: 100,
              Massachusetts: 500,
              Michigan: 50,
              Minnesota: 135,
              Mississippi: 50,
              Missouri: 50,
              Montana: 70,
              Nebraska: 105,
              Nevada: 425,
              "New Hampshire": 100,
              "New Jersey": 125,
              "New Mexico": 50,
              "New York": 200,
              "North Carolina": 125,
              "North Dakota": 135,
              Ohio: 99,
              Oklahoma: 100,
              Oregon: 100,
              Pennsylvania: 125,
              "Rhode Island": 150,
              "South Carolina": 110,
              "South Dakota": 150,
              Tennessee: 300,
              Texas: 300,
              Utah: 54,
              Vermont: 125,
              Virginia: 100,
              Washington: 180,
              "West Virginia": 100,
              Wisconsin: 130,
              Wyoming: 100,
              "District of Columbia": 99,
            },
            stateDiscounts: {
              "New Mexico": 40,
              Wyoming: 80,
              Nevada: 325,
              Delaware: 70,
              "South Dakota": 120,
            },
            stateDescriptions: {
              Alabama: "Annual Report: $50 (10th April)",
              Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
              Arizona: "Annual Report: $0 (No annual report required)",
              Arkansas: "Annual Report: $150 (1st May)",
              California: "Annual Report: $800 minimum tax + $20 filing fee (15th day of 4th month)",
              Colorado: "Annual Report: $10 (end of month of formation)",
              Connecticut: "Annual Report: $80 (anniversary of formation)",
              Delaware: "Annual Report: $300 + franchise tax (1st June)",
              Florida: "Annual Report: $138.75 (1st May)",
              Georgia: "Annual Report: $50 (1st April)",
              Hawaii: "Annual Report: $15 (end of quarter of formation)",
              Idaho: "Annual Report: $0 (end of month of formation)",
              Illinois: "Annual Report: $75 (first day of anniversary month)",
              Indiana: "Biennial Report: $32 (anniversary month of formation)",
              Iowa: "Biennial Report: $60 (1st April)",
              Kansas: "Annual Report: $55 (15th day of 4th month after fiscal year end)",
              Kentucky: "Annual Report: $15 (30th June)",
              Louisiana: "Annual Report: $35 (anniversary of formation)",
              Maine: "Annual Report: $85 (1st June)",
              Maryland: "Annual Report: $300 (15th April)",
              Massachusetts: "Annual Report: $500 (anniversary date)",
              Michigan: "Annual Report: $25 (15th Feb)",
              Minnesota: "Annual Report: $0 (31st Dec)",
              Mississippi: "Annual Report: $0 (15th April)",
              Missouri: "Annual Report: $0 (No annual report required)",
              Montana: "Annual Report: $20 (15th April)",
              Nebraska: "Biennial Report: $10 (1st April)",
              Nevada: "Annual List: $150 + $200 business license fee (last day of month of formation)",
              "New Hampshire": "Annual Report: $100 (1st April)",
              "New Jersey": "Annual Report: $75 (last day of anniversary month)",
              "New Mexico": "Annual Report: $0 (No annual report required)",
              "New York": "Biennial Statement: $9 (anniversary month)",
              "North Carolina": "Annual Report: $200 (15th April)",
              "North Dakota": "Annual Report: $50 (1st Nov)",
              Ohio: "Biennial Report: $0 (No report required)",
              Oklahoma: "Annual Report: $25 (anniversary date)",
              Oregon: "Annual Report: $100 (anniversary date)",
              Pennsylvania: "Decennial Report: $70 (every 10 years)",
              "Rhode Island": "Annual Report: $50 (1st Nov)",
              "South Carolina": "Annual Report: $0 (No annual report required)",
              "South Dakota": "Annual Report: $50 (1st anniversary month)",
              Tennessee: "Annual Report: $300 min (1st day of 4th month after fiscal year end)",
              Texas: "Annual Report: $0 (15th May)",
              Utah: "Annual Report: $18 (anniversary month)",
              Vermont: "Annual Report: $35 (anniversary quarter)",
              Virginia: "Annual Report: $50 (last day of month when formed)",
              Washington: "Annual Report: $60 (end of anniversary month)",
              "West Virginia": "Annual Report: $25 (1st July)",
              Wisconsin: "Annual Report: $25 (end of quarter of formation)",
              Wyoming: "Annual Report: $60 min (first day of anniversary month)",
              "District of Columbia": "Biennial Report: $300 (1st April)",
            },
          }

          // Save the complete data back to the API
          try {
            await fetch("/api/pricing", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(completeStateData),
            })

            // Use the complete data
            setPricingData(completeStateData)
          } catch (saveError) {
            console.error("Error saving complete state data:", saveError)
            // Still use the complete data even if saving fails
            setPricingData(completeStateData)
          }
        } else {
          // Use the data from the API if it's complete
          setPricingData(data)
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error)
        setError("Failed to load pricing information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPricingData()

    // Set up polling to check for updates every hour (3600000 ms)
    const intervalId = setInterval(fetchPricingData, 3600000)

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [])

  const resetState = () => {
    setSelectedState("")
  }

  const calculateTotalPrice = (basePrice: number) => {
    if (!selectedState) return basePrice

    const stateFee = pricingData.stateFilingFees[selectedState]
    const discountedFee = pricingData.stateDiscounts[selectedState] || stateFee
    const discount = stateFee - discountedFee

    return basePrice + stateFee - discount
  }

  const hasDiscount = (state: string) => {
    return state in pricingData.stateDiscounts
  }

  const handleAddToCart = (tier: PricingTier) => {
    // If already in cart, go to checkout
    if (isInCart(tier.name, selectedState)) {
      router.push("/checkout")
      return
    }

    // Otherwise add to cart
    interface CartItem {
      tier: string
      price: number
      state?: string
      stateFee?: number
      discount?: number
    }

    const newItem: CartItem = {
      tier: tier.name,
      price: tier.price,
    }

    if (selectedState) {
      newItem.state = selectedState
      newItem.stateFee = pricingData.stateFilingFees[selectedState]

      if (hasDiscount(selectedState)) {
        newItem.discount = pricingData.stateDiscounts[selectedState]
      }
    }

    addItem(newItem)

    toast({
      title: "Added to cart",
      description: `${tier.name} package${selectedState ? ` for ${selectedState}` : ""} has been added to your cart.`,
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] sm:min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#22c984]"></div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px] sm:min-h-[400px]">
        <div className="text-center px-4">
          <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm" className="sm:text-base">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ScrollAnimation>
      <div className="w-full max-w-full mx-auto px-3 sm:px-[5%] py-4 sm:py-8 overflow-x-hidden">
        {/* State Selection Dropdown */}
        <div className="mb-4 sm:mb-8 w-full max-w-xs mx-auto relative">
          <div className="flex items-center">
            <div className="flex-grow">
              <Select onValueChange={(value) => setSelectedState(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(pricingData.stateFilingFees)
                    .sort()
                    .map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset button */}
            {selectedState && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-10 w-10 rounded-full hover:bg-gray-100"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Reset state selection</span>
              </Button>
            )}
          </div>

          {selectedState && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              <div className="font-medium">State filing fee: ${pricingData.stateFilingFees[selectedState]}</div>
              {hasDiscount(selectedState) && (
                <div className="text-[#22c984] font-medium">
                  After Including discount: ${pricingData.stateDiscounts[selectedState]}
                </div>
              )}
              <div className="mt-1">{pricingData.stateDescriptions[selectedState]}</div>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-[30px]">
          {pricingData.plans.map((tier) => (
            <div
              key={tier.id}
              className={`relative border rounded-lg p-4 sm:p-6 bg-white transition duration-300 ease-in-out transform hover:scale-105 ${
                tier.isRecommended ? "border-[#22c984]" : "border-gray-200"
              } hover:border-[#22c984] hover:shadow-lg`}
            >
              {tier.isRecommended && (
                <div className="absolute top-[-10px] right-[-10px] bg-[#22c984] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  RECOMMENDED
                </div>
              )}
              <div className="mb-4 flex items-center justify-center gap-2">
                <h3 style={{ fontFamily: "Montserrat", fontWeight: "500", fontSize: "22px" }}>{tier.name}</h3>
                {tier.hasAssistBadge && (
                  <div className="flex items-center bg-gray-200 text-sm font-medium text-gray-800 px-2 py-1 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-black mr-1" />
                    ASSIST
                  </div>
                )}
              </div>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-normal break-words">
                  {selectedState && hasDiscount(selectedState) ? (
                    <>
                      <del className="text-[#22c984] mr-2">
                        ${tier.price + pricingData.stateFilingFees[selectedState]}
                      </del>
                      ${calculateTotalPrice(tier.price)}
                    </>
                  ) : (
                    `$${calculateTotalPrice(tier.price)}`
                  )}
                </span>
                {selectedState ? (
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center flex-wrap">
                      <span className="text-[#323232]">
                        Base: ${tier.price} + Fee: ${pricingData.stateFilingFees[selectedState]}
                      </span>
                      {hasDiscount(selectedState) && (
                        <span
                          className="text-[#000000] sm:ml-1"
                          style={{ textDecoration: "underline", textDecorationColor: "red" }}
                        >
                          - Discount: ${pricingData.stateDiscounts[selectedState]}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-600 ml-2">+ state filing fees</span>
                )}
              </div>

              <p
                style={{ fontFamily: "Nethead", fontSize: "16px", color: "#4A4A4A" }}
                className="mb-4 sm:mb-6 text-sm sm:text-base"
              >
                {tier.description}
              </p>

              {/* Single action button that changes based on cart state */}
              <Button
                style={{ fontFamily: "Nethead", fontSize: "16px" }}
                className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white hover:text-black mb-6"
                onClick={() => handleAddToCart(tier)}
              >
                {isInCart(tier.name, selectedState) ? "Buy Now" : "Add to Cart"}
              </Button>

              <div className="space-y-4">
                {tier.includesPackage && (
                  <p style={{ fontFamily: "nethead", fontSize: "16px" }}>
                    Includes <span className="font-bold">{tier.includesPackage}</span> package, plus:
                  </p>
                )}
                {!tier.includesPackage && <p style={{ fontFamily: "nethead", fontSize: "16px" }}>Includes:</p>}
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex gap-2 sm:gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                    <span
                      style={{ fontFamily: "nethead", fontSize: "14px", color: "#4A4A4A" }}
                      className="text-sm sm:text-base"
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollAnimation>
  )
}

