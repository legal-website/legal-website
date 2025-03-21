"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { usePricing } from "@/context/pricing-context"

export default function TestPricingPage() {
  const { pricingData, loading, error, refreshPricingData, updatePricingData } = usePricing()
  const [testPrice, setTestPrice] = useState<number>(0)
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (pricingData && pricingData.plans && pricingData.plans.length > 0) {
      setTestPrice(pricingData.plans[0].price)
    }
  }, [pricingData])

  const handleUpdatePrice = async () => {
    if (!pricingData || !pricingData.plans || pricingData.plans.length === 0) return

    setUpdating(true)
    setMessage(null)

    try {
      // Create a deep copy of the pricing data
      const updatedData = JSON.parse(JSON.stringify(pricingData))

      // Update the price of the first plan
      updatedData.plans[0].price = testPrice
      updatedData.plans[0].displayPrice = `$${testPrice}`

      console.log("Updating with new data:", updatedData.plans[0])

      const success = await updatePricingData(updatedData)

      if (success) {
        setMessage(`Successfully updated price to $${testPrice}`)
      } else {
        setMessage("Failed to update price")
      }
    } catch (error) {
      console.error("Error updating price:", error)
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
    return <div className="p-8">Loading pricing data...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Pricing Data</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded ${message.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Pricing Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">STARTER Plan</h3>
                <p>Price: ${pricingData.plans[0]?.price}</p>
                <p>Display Price: {pricingData.plans[0]?.displayPrice}</p>
              </div>

              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span>$</span>
                <Input
                  type="number"
                  value={testPrice}
                  onChange={(e) => setTestPrice(Number(e.target.value))}
                  className="w-24"
                />
              </div>

              <Button onClick={handleUpdatePrice} disabled={updating}>
                {updating ? "Updating..." : "Update STARTER Price"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Raw Data</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(pricingData, null, 2)}</pre>
      </div>
    </div>
  )
}

