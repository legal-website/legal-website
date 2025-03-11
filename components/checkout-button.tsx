"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { processCheckout } from "@/lib/checkout"

interface CheckoutButtonProps {
  items: any[]
  total: number
  customer: {
    name: string
    email: string
    [key: string]: any
  }
  className?: string
}

export default function CheckoutButton({ items, total, customer, className = "" }: CheckoutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const result = await processCheckout({
        customer,
        items,
        total,
      })

      if (result.success && result.invoice) {
        toast({
          title: "Checkout Successful",
          description: "Your order has been placed successfully.",
        })

        // Redirect to the invoice page
        router.push(`/invoice/${result.invoice.id}`)
      } else {
        throw new Error(result.error || "Failed to process checkout")
      }
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

