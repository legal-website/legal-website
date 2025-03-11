"use client"
import Image from "next/image"
import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/components/ui/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
    company: "",
  })

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push("/")
    }
  }, [items, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Prepare simplified items to reduce memory usage
      const simplifiedItems = items.map((item) => ({
        id: item.id,
        tier: item.tier,
        price: Number(item.price),
        stateFee: item.stateFee ? Number(item.stateFee) : undefined,
        state: item.state || undefined,
        discount: item.discount ? Number(item.discount) : undefined,
      }))

      // Create invoice
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: formData,
          items: simplifiedItems,
          total: getCartTotal(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create invoice")
      }

      const data = await response.json()

      if (!data.invoiceId) {
        throw new Error("No invoice ID returned from server")
      }

      // Redirect to invoice page
      router.push(`/invoice/${data.invoiceId}`)
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-36 mb-44">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Information</h2>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                </div>

                <div>
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Billing Address</h2>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                  </div>

                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip">ZIP/Postal Code</Label>
                    <Input id="zip" name="zip" value={formData.zip} onChange={handleInputChange} />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white" disabled={loading}>
              {loading ? "Processing..." : "Continue to Payment"}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border-b pb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.tier} Package</span>
                      <span>${item.price}</span>
                    </div>

                    {item.state && item.stateFee && (
                      <div className="flex justify-between mt-1 text-sm text-gray-600">
                        <span>{item.state} State Filing Fee</span>
                        <span>${item.stateFee}</span>
                      </div>
                    )}

                    {item.discount && (
                      <div className="flex justify-between mt-1 text-sm text-[#22c984]">
                        <span>Discounted Price</span>
                        <span>${item.discount}</span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${getCartTotal()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-sm text-gray-500 mb-4">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Image src="/Visa.svg" alt="Visa" className="h-20" width={80} height={80} />
                <Image src="/mastercard.svg" alt="Mastercard" className="h-20" width={80} height={80} />
                <Image src="/amex.svg" alt="Amex" className="h-20" width={80} height={80} />
                <Image src="/stripe.svg" alt="Stripe" className="h-20" width={80} height={80} />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

