"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle, X, Tag, Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/components/ui/use-toast"
import type { CouponType } from "@/lib/prisma-types"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const { toast } = useToast()
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
    description: string
    type: CouponType
    value: number
    discount: number
  } | null>(null)

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

    // Check for affiliate code in localStorage
    if (typeof window !== "undefined") {
      const storedAffiliateCode = localStorage.getItem("affiliateCode")
      if (storedAffiliateCode) {
        console.log("Found affiliate code in localStorage:", storedAffiliateCode)
        setAffiliateCode(storedAffiliateCode)
      }

      // Check for applied coupon in localStorage
      const storedCoupon = localStorage.getItem("appliedCoupon")
      const storedCouponData = localStorage.getItem("couponData")

      if (storedCoupon && storedCouponData) {
        try {
          const couponData = JSON.parse(storedCouponData)
          validateCoupon(storedCoupon)
        } catch (error) {
          console.error("Error parsing stored coupon data:", error)
        }
      }
    }
  }, [items, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateCoupon = async (code: string) => {
    if (!code) return

    try {
      setValidatingCoupon(true)

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          cartTotal: getCartTotal(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid coupon code")
      }

      if (data.valid && data.coupon) {
        setAppliedCoupon({
          ...data.coupon,
          discount: data.coupon.discount || 0,
        })

        toast({
          title: "Coupon applied",
          description: `${data.coupon.code} has been applied to your order.`,
        })

        // Store in localStorage
        localStorage.setItem("appliedCoupon", data.coupon.code)
        localStorage.setItem("couponData", JSON.stringify(data.coupon))
      }
    } catch (error: any) {
      console.error("Error validating coupon:", error)
      toast({
        title: "Invalid coupon",
        description: error.message || "This coupon code is invalid or cannot be applied to your order.",
        variant: "destructive",
      })

      // Clear any previously applied coupon
      setAppliedCoupon(null)
      localStorage.removeItem("appliedCoupon")
      localStorage.removeItem("couponData")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleApplyCoupon = () => {
    validateCoupon(couponCode)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    localStorage.removeItem("appliedCoupon")
    localStorage.removeItem("couponData")

    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
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
      // Calculate final total with discount
      const cartTotal = getCartTotal()
      const discount = appliedCoupon ? appliedCoupon.discount : 0
      const finalTotal = Math.max(0, cartTotal - discount)

      // Store customer data in session storage for the payment page
      sessionStorage.setItem(
        "checkoutData",
        JSON.stringify({
          customer: formData,
          items: items,
          total: finalTotal,
          originalTotal: cartTotal,
          discount: discount,
          coupon: appliedCoupon
            ? {
                id: appliedCoupon.id,
                code: appliedCoupon.code,
              }
            : null,
          affiliateCode: affiliateCode, // Store the affiliate code directly
        }),
      )

      // Redirect to payment page
      router.push("/checkout/payment")
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

  // Calculate totals
  const cartTotal = getCartTotal()
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const finalTotal = Math.max(0, cartTotal - discount)

  return (
    <div className="container mx-auto py-12 px-4 md:px-36 mb-44">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          {affiliateCode && (
            <div className="bg-green-50 p-4 rounded-md flex items-start mb-6">
              <AlertCircle className="text-green-500 mr-2 mt-0.5" size={18} />
              <div>
                <p className="text-green-800 font-medium">Referral code applied</p>
                <p className="text-green-700 text-sm">You're using a referral code: {affiliateCode}</p>
              </div>
            </div>
          )}

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

                {/* Coupon Code Input */}
                <div className="pt-4 border-t">
                  <Label htmlFor="couponCode" className="text-sm font-medium mb-2 block">
                    Apply Coupon
                  </Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm ml-2">(-${appliedCoupon.discount.toFixed(2)})</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 w-8 p-0">
                        <X className="h-4 w-4 text-green-700" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="couponCode"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleApplyCoupon} disabled={!couponCode || validatingCoupon} variant="outline">
                        {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 mt-1">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
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

