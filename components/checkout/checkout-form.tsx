"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CheckoutForm({ packageId, packageName, amount }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    notes: "",
  })

  // Get affiliate code from localStorage if it exists
  const [affiliateCode, setAffiliateCode] = useState("")

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const storedAffiliateCode = localStorage.getItem("affiliateCode")
      if (storedAffiliateCode) {
        setAffiliateCode(storedAffiliateCode)
        console.log("Found affiliate code in localStorage:", storedAffiliateCode)
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Store affiliate code in a field that will be visible to admins
      // We'll use the company field if it's empty, otherwise append to address
      const updatedFormData = { ...formData }

      if (affiliateCode) {
        if (!updatedFormData.company) {
          updatedFormData.company = `ref:${affiliateCode}`
        } else if (!updatedFormData.address) {
          updatedFormData.address = `ref:${affiliateCode}`
        } else if (!updatedFormData.city) {
          updatedFormData.city = `ref:${affiliateCode}`
        }
      }

      const response = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedFormData,
          packageId,
          packageName,
          amount,
          affiliateCode, // Also send it as a separate field
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to payment page
        router.push(`/checkout/payment/${data.invoiceId}`)
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Error submitting checkout form:", error)
      alert("An error occurred while processing your request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" name="company" value={formData.company} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zip">ZIP/Postal Code</Label>
            <Input id="zip" name="zip" value={formData.zip} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={formData.country} onChange={handleChange} />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="min-h-[100px]" />
        </div>
      </div>

      {affiliateCode && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-green-700 text-sm">Referral code applied: {affiliateCode}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Continue to Payment"}
      </Button>
    </form>
  )
}

