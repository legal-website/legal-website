"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

interface CheckoutFormProps {
  packageId: string
  packageName: string
  amount: number
}

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  notes: string
}

export function CheckoutForm({ packageId, packageName, amount }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Submitting checkout form with affiliate code:", affiliateCode)

      // Create a copy of the form data to modify
      const modifiedFormData = { ...formData }

      // Store the affiliate code in the company field with a prefix
      if (affiliateCode) {
        // If company field is empty, use it for the affiliate code
        if (!modifiedFormData.company || modifiedFormData.company.trim() === "") {
          modifiedFormData.company = `ref:${affiliateCode}`
          console.log("Storing affiliate code in company field:", modifiedFormData.company)
        }
        // Otherwise, use the address field
        else if (!modifiedFormData.address || modifiedFormData.address.trim() === "") {
          modifiedFormData.address = `ref:${affiliateCode}`
          console.log("Storing affiliate code in address field:", modifiedFormData.address)
        }
        // If both are used, use the city field
        else if (!modifiedFormData.city || modifiedFormData.city.trim() === "") {
          modifiedFormData.city = `ref:${affiliateCode}`
          console.log("Storing affiliate code in city field:", modifiedFormData.city)
        }
      }

      const response = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...modifiedFormData,
          packageId,
          packageName,
          amount,
          affiliateCode, // Also send it as a separate field
        }),
      })

      const data = await response.json()
      console.log("Checkout response:", data)

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
      {affiliateCode && (
        <div className="bg-green-50 p-4 rounded-md flex items-start">
          <AlertCircle className="text-green-500 mr-2 mt-0.5" size={18} />
          <div>
            <p className="text-green-800 font-medium">Referral code applied</p>
            <p className="text-green-700 text-sm">You're using a referral code: {affiliateCode}</p>
          </div>
        </div>
      )}

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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Continue to Payment"}
      </Button>
    </form>
  )
}

