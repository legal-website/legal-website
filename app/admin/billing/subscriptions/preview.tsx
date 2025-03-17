"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our data
interface PricingPlan {
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
  plans: PricingPlan[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
}

export default function PricingPreview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string>("")

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
        setPricingData(data)
        setError(null)
      } catch (error) {
        console.error("Error fetching pricing data:", error)
        setError("Failed to load pricing information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPricingData()
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

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="state">State Selection</TabsTrigger>
            </TabsList>

            <TabsContent value="state">
              <div className="max-w-xs mb-4">
                <Select onValueChange={(value) => setSelectedState(value)} value={selectedState}>
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

                {selectedState && (
                  <div className="mt-4 p-4 border rounded-md">
                    <div className="font-medium">State filing fee: ${pricingData.stateFilingFees[selectedState]}</div>
                    {hasDiscount(selectedState) && (
                      <div className="text-green-600 font-medium">
                        After discount: ${pricingData.stateDiscounts[selectedState]}
                      </div>
                    )}
                    <div className="mt-1 text-sm">{pricingData.stateDescriptions[selectedState]}</div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={resetState}>
                      Reset State
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="grid md:grid-cols-3 gap-6">
                {pricingData.plans.map((tier) => (
                  <Card key={tier.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="relative">
                        {tier.isRecommended && (
                          <div className="absolute top-[-10px] right-[-10px] bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                            RECOMMENDED
                          </div>
                        )}
                        <div className="mb-4 flex items-center justify-center gap-2">
                          <h3 className="font-medium text-xl">{tier.name}</h3>
                          {tier.hasAssistBadge && (
                            <div className="flex items-center bg-gray-200 text-sm font-medium text-gray-800 px-2 py-1 rounded-lg">
                              <ShieldCheck className="h-4 w-4 text-black mr-1" />
                              ASSIST
                            </div>
                          )}
                        </div>
                        <div className="mb-4 text-center">
                          <span className="text-3xl font-normal">
                            {selectedState && hasDiscount(selectedState) ? (
                              <>
                                <del className="text-green-500 mr-2">
                                  ${tier.price + pricingData.stateFilingFees[selectedState]}
                                </del>
                                ${calculateTotalPrice(tier.price)}
                              </>
                            ) : (
                              `$${calculateTotalPrice(tier.price)}`
                            )}
                          </span>
                          {selectedState ? (
                            <div className="text-sm text-gray-600 mt-1">
                              <div>
                                <span>
                                  Base price: ${tier.price} + State fee: ${pricingData.stateFilingFees[selectedState]}
                                </span>
                                {hasDiscount(selectedState) && (
                                  <span className="text-green-600">
                                    {" "}
                                    - Discount: $
                                    {pricingData.stateFilingFees[selectedState] -
                                      pricingData.stateDiscounts[selectedState]}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600 ml-2">+ state filing fees</span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-6">{tier.description}</p>

                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white mb-6">Add to Cart</Button>

                        <div className="space-y-4">
                          {tier.includesPackage && (
                            <p>
                              Includes <span className="font-bold">{tier.includesPackage}</span> package, plus:
                            </p>
                          )}
                          {!tier.includesPackage && <p>Includes:</p>}
                          {tier.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex gap-3">
                              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                              <span className="text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

