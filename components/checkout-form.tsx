"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface CheckoutFormProps {
  items: any[]
  total: number
  onSuccess?: (invoiceId: string) => void
  onError?: (error: Error) => void
}

export default function CheckoutForm({ items, total, onSuccess, onError }: CheckoutFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Format the data to match what the API expects
      const checkoutData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          country: formData.country || null,
        },
        items: items,
        total: total,
      }

      console.log("Sending checkout data:", checkoutData)

      // Send the data to the API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      // Log the raw response for debugging
      console.log("Checkout response status:", response.status)

      // Clone the response so we can log it and still use it
      const responseClone = response.clone()
      const rawText = await responseClone.text()
      console.log("Raw response:", rawText)

      // Try to parse the response as JSON
      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to process checkout")
      }

      console.log("Checkout successful:", data)

      // Show success message
      toast({
        title: "Checkout Successful",
        description: "Your order has been placed successfully.",
      })

      // Check if we have an invoice ID
      if (data.invoice && data.invoice.id) {
        // Call the success callback if provided
        if (onSuccess) {
          onSuccess(data.invoice.id)
        }

        // Redirect to the invoice page
        router.push(`/invoice/${data.invoice.id}`)
      } else if (data.success && data.invoice) {
        // Alternative format - success flag with invoice object
        if (onSuccess) {
          onSuccess(data.invoice.id)
        }

        router.push(`/invoice/${data.invoice.id}`)
      } else {
        console.error("No invoice ID returned from server:", data)
        toast({
          title: "Warning",
          description: "Order placed but invoice details are missing.",
          variant: "destructive",
        })

        if (onError) {
          onError(new Error("No invoice ID returned from server"))
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })

      if (onError) {
        onError(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields would go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        {/* Add more form fields as needed */}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isSubmitting ? "Processing..." : `Complete Purchase - $${total.toFixed(2)}`}
      </button>
    </form>
  )
}

