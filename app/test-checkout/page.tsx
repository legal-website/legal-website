"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function TestCheckout() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "Test Customer",
    email: "test@example.com",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResponse(null)

    try {
      // Create test checkout data
      const checkoutData = {
        customer: {
          name: formData.name,
          email: formData.email,
        },
        items: [
          {
            id: "test-item-1",
            tier: "BASIC",
            price: 99.99,
          },
        ],
        total: 99.99,
      }

      console.log("Sending test checkout data:", checkoutData)

      // Send the data to the API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      const data = await response.json()
      setResponse(data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to process checkout")
      }

      console.log("Test checkout successful:", data)

      toast({
        title: "Test Successful",
        description: "The checkout API is working correctly.",
      })

      // Offer to redirect to the invoice page
      if (data.invoice && data.invoice.id) {
        setTimeout(() => {
          if (confirm("Would you like to view the created invoice?")) {
            router.push(`/invoice/${data.invoice.id}`)
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error("Test checkout error:", error)
      toast({
        title: "Test Failed",
        description: error.message || "Something went wrong with the test.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Checkout API</CardTitle>
          <CardDescription>Use this form to test the checkout API endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Customer Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Testing..." : "Test Checkout API"}
            </Button>
          </form>
        </CardContent>
        {response && (
          <CardFooter className="flex flex-col items-start">
            <h3 className="font-medium mb-2">API Response:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto w-full text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

