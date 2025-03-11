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
      // Log the checkout attempt
      console.log("Starting checkout process...")

      // Prepare checkout data - match the exact format that worked in the direct test
      const checkoutData = {
        customer: {
          name: customer.name,
          email: customer.email,
        },
        items: items.map((item) => ({
          id: item.id || `item-${Date.now()}`,
          tier: item.tier,
          price: Number(item.price),
        })),
        total: Number(total),
      }

      console.log("Sending checkout data:", checkoutData)

      // Use the direct-checkout endpoint that we know works
      const response = await fetch("/api/direct-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
        cache: "no-store", // Prevent caching
      })

      // Log the response status
      console.log("Response status:", response.status)

      // Get the raw response text first
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      // Parse the response text
      const data = JSON.parse(responseText)
      console.log("Parsed response:", data)

      // Verify we have an invoice
      if (!data.invoice || !data.invoice.id) {
        throw new Error("No invoice data in response")
      }

      // Success! Show toast and redirect
      toast({
        title: "Purchase Successful",
        description: `Invoice #${data.invoice.invoiceNumber} has been created.`,
      })

      // Wait a brief moment for the toast to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to the invoice page
      router.push(`/invoice/${data.invoice.id}`)
    } catch (error: any) {
      console.error("Checkout error:", error)

      // Show error toast
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
    <Button
      onClick={handleCheckout}
      disabled={isProcessing}
      className={`w-full bg-green-500 hover:bg-green-600 text-white ${className}`}
    >
      {isProcessing ? "Processing..." : `Complete Purchase - $${total.toFixed(2)}`}
    </Button>
  )
}

