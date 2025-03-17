"use client"

import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

import { PricingTable } from "@/components/pricing/pricing-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

interface PricingData {
  starter: number
  pro: number
  business: number
}

const defaultPricingData: PricingData = {
  starter: 10,
  pro: 50,
  business: 100,
}

async function getPricingData(): Promise<PricingData> {
  // Simulate fetching pricing data from a database or API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(defaultPricingData)
    }, 500)
  })
}

async function savePricingData(data: PricingData) {
  // Simulate saving pricing data to a database or API
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate a potential error
      // reject(new Error("Failed to connect to database."))
      resolve(data)
    }, 500)
  })
}

const AdminBillingSubscriptionsPage = () => {
  const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contextError, setContextError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadPricingData = async () => {
      setIsLoading(true)
      try {
        const data = await getPricingData()
        setPricingData(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("Error loading pricing data:", errorMessage)
        setError(`Failed to load pricing data: ${errorMessage}`)
        setContextError("Database connection issue. Please check your database credentials.")
        toast({
          title: "Error",
          description: "Failed to load pricing data. Please check the console for details.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPricingData()
  }, [toast])

  const handleInputChange = (plan: keyof PricingData, value: string) => {
    const parsedValue = Number.parseFloat(value)
    if (!isNaN(parsedValue)) {
      setPricingData((prev) => ({ ...prev, [plan]: parsedValue }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await savePricingData(pricingData)
      toast({
        title: "Success",
        description: "Pricing data saved successfully.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error saving pricing data:", errorMessage)
      setError(`Failed to save pricing data: ${errorMessage}`)
      setContextError("Database connection issue. Please check your database credentials.")
      toast({
        title: "Error",
        description: "Failed to save pricing data. Please check database connection.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Subscription Pricing</h1>
        <p className="text-muted-foreground">Manage the pricing for your subscription plans.</p>
      </div>
      <Separator className="my-6" />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <p className="text-sm mt-1">
              If this error persists, please check your database connection and credentials.
            </p>
          </div>
        </div>
      )}

      {contextError && error !== contextError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Context Error</p>
            <p>{contextError}</p>
            <p className="text-sm mt-1">Database connection issue. Please check your database credentials.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="starter">Starter Plan Price</Label>
          <Input
            type="number"
            id="starter"
            placeholder="Enter price"
            value={pricingData.starter.toString()}
            onChange={(e) => handleInputChange("starter", e.target.value)}
            disabled={isLoading || isSaving}
          />
        </div>
        <div>
          <Label htmlFor="pro">Pro Plan Price</Label>
          <Input
            type="number"
            id="pro"
            placeholder="Enter price"
            value={pricingData.pro.toString()}
            onChange={(e) => handleInputChange("pro", e.target.value)}
            disabled={isLoading || isSaving}
          />
        </div>
        <div>
          <Label htmlFor="business">Business Plan Price</Label>
          <Input
            type="number"
            id="business"
            placeholder="Enter price"
            value={pricingData.business.toString()}
            onChange={(e) => handleInputChange("business", e.target.value)}
            disabled={isLoading || isSaving}
          />
        </div>
      </div>
      <Button className="mt-6" onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
      <Separator className="my-6" />
      <PricingTable pricing={pricingData} />
    </div>
  )
}

export default AdminBillingSubscriptionsPage

