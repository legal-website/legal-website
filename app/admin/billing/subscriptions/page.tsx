"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

// Placeholder function for updating pricing data (replace with your actual API call)
const updatePricingData = async (data: any): Promise<boolean> => {
  // Simulate an API call with a random success/failure
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1 // Simulate occasional failure
      resolve(success)
    }, 1000)
  })
}

const AdminBillingSubscriptionsPage = () => {
  const [pricingData, setPricingData] = useState({
    monthlyPrice: 10,
    annualPrice: 100,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPricingData((prev) => ({
      ...prev,
      [name]: Number(value),
    }))
  }

  // Update the savePricingData function to better handle errors
  const savePricingData = async () => {
    try {
      setSaving(true)
      setError(null)

      console.log("Saving pricing data...", pricingData)
      const success = await updatePricingData(pricingData)

      if (success) {
        toast({
          title: "Success",
          description: "Pricing data has been saved successfully.",
        })
      } else {
        throw new Error("Failed to save pricing data")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error saving pricing data:", errorMessage)
      setError(`Failed to save pricing data: ${errorMessage}`)
      toast({
        title: "Error",
        description: `Failed to save pricing data: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Subscription Pricing</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyPrice">Monthly Price</Label>
          <Input
            type="number"
            id="monthlyPrice"
            name="monthlyPrice"
            value={pricingData.monthlyPrice}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="annualPrice">Annual Price</Label>
          <Input
            type="number"
            id="annualPrice"
            name="annualPrice"
            value={pricingData.annualPrice}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <Button className="mt-4" onClick={savePricingData} disabled={saving}>
        {saving ? "Saving..." : "Save Pricing"}
      </Button>
    </div>
  )
}

export default AdminBillingSubscriptionsPage

