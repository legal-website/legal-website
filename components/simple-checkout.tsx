"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface SimpleCheckoutProps {
  items: any[]
  total: number
  customer: {
    name: string
    email: string
    [key: string]: any
  }
  className?: string
}

export default function SimpleCheckout({ items, total, customer, className = "" }: SimpleCheckoutProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      // Prepare checkout data
      const checkoutData = {
        customer,
        items,
        total,
      }

      console.log("Sending checkout data:", checkoutData)

      // Use the direct checkout endpoint
      const response = await fetch("/api/direct-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      // Log the raw response
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      // Try to parse the response
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        throw new Error("Invalid response from server")
      }

      // Check for errors
      if (!response.ok) {
        throw new Error(data.error || data.message || "Checkout failed")
      }

      // Check if we have an invoice
      if (!data.invoice) {
        console.error("No invoice in response:", data)
        throw new Error("No invoice returned from server")
      }

      // Success!
      console.log("Checkout successful:", data)
      toast({
        title: "Checkout Successful",
        description: "Your order has been placed successfully.",
      })

      // Redirect to the invoice page
      router.push(`/invoice/${data.invoice.id}`)
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isProcessing} className={className}>
      {isProcessing ? "Processing..." : `Complete Purchase - $${total.toFixed(2)}`}
    </Button>
  )
}

