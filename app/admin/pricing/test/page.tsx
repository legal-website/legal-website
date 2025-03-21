"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePricing } from "@/context/pricing-context"
import { RefreshCw, AlertCircle } from "lucide-react"

export default function TestPricingPage() {
  const { pricingData, loading, error, refreshPricingData, updatePricingData } = usePricing()
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("plans")

  // State for plan prices
  const [planPrices, setPlanPrices] = useState<{ [key: number]: number }>({})

  // State for state filing fee
  const [selectedState, setSelectedState] = useState<string>("Alabama")
  const [stateFee, setStateFee] = useState<number>(0)

  useEffect(() => {
    if (pricingData && pricingData.plans) {
      const prices: { [key: number]: number } = {}
      pricingData.plans.forEach((plan) => {
        prices[plan.id] = plan.price
      })
      setPlanPrices(prices)
    }

    if (pricingData && pricingData.stateFilingFees && selectedState) {
      setStateFee(pricingData.stateFilingFees[selectedState] || 0)
    }
  }, [pricingData, selectedState])

  const handleUpdatePlanPrice = async (planId: number) => {
    if (!pricingData || !pricingData.plans) return

    setUpdating(true)
    setMessage(null)

    try {
      // Create a deep copy of the pricing data
      const updatedData = JSON.parse(JSON.stringify(pricingData))

      // Find the plan and update its price
      const planIndex = updatedData.plans.findIndex((p: any) => p.id === planId)
      if (planIndex === -1) {
        throw new Error(`Plan with ID ${planId} not found`)
      }

      updatedData.plans[planIndex].price = planPrices[planId]
      updatedData.plans[planIndex].displayPrice = `$${planPrices[planId]}`

      console.log(`Updating ${updatedData.plans[planIndex].name} price to $${planPrices[planId]}`)

      const success = await updatePricingData(updatedData)

      if (success) {
        setMessage(`Successfully updated ${updatedData.plans[planIndex].name} price to $${planPrices[planId]}`)
      } else {
        setMessage(`Failed to update ${updatedData.plans[planIndex].name} price`)
      }
    } catch (error) {
      console.error("Error updating price:", error)
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStateFee = async () => {
    if (!pricingData || !selectedState) return

    setUpdating(true)
    setMessage(null)

    try {
      // Create a deep copy of the pricing data
      const updatedData = JSON.parse(JSON.stringify(pricingData))

      // Update the state filing fee
      updatedData.stateFilingFees[selectedState] = stateFee

      console.log(`Updating ${selectedState} filing fee to $${stateFee}`)

      const success = await updatePricingData(updatedData)

      if (success) {
        setMessage(`Successfully updated ${selectedState} filing fee to $${stateFee}`)
      } else {
        setMessage(`Failed to update ${selectedState} filing fee`)
      }
    } catch (error) {
      console.error("Error updating state fee:", error)
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setMessage(null)

    try {
      await refreshPricingData()
      setMessage("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Try Again"}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Test Pricing Data</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Test updating different parts of the pricing data</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded ${message.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="states">State Filing Fees</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingData.plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name} Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-xl font-bold">{plan.displayPrice}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>$</span>
                      <Input
                        type="number"
                        value={planPrices[plan.id] || 0}
                        onChange={(e) =>
                          setPlanPrices({
                            ...planPrices,
                            [plan.id]: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                      <Button onClick={() => handleUpdatePlanPrice(plan.id)} disabled={updating} className="ml-2">
                        {updating ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="states" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>State Filing Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {Object.keys(pricingData.stateFilingFees)
                      .sort()
                      .map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Current Fee</p>
                  <p className="text-xl font-bold">${pricingData.stateFilingFees[selectedState] || 0}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span>$</span>
                  <Input
                    type="number"
                    value={stateFee}
                    onChange={(e) => setStateFee(Number(e.target.value))}
                    className="w-24"
                  />
                  <Button onClick={handleUpdateStateFee} disabled={updating} className="ml-2">
                    {updating ? "Updating..." : "Update Fee"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(pricingData, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

