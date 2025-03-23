"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function PaymentForm({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Get affiliate code from localStorage if it exists
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const storedCode = localStorage.getItem("affiliateCode")
      if (storedCode) {
        setAffiliateCode(storedCode)
        console.log("Retrieved affiliate code from localStorage:", storedCode)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a receipt file to upload")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("invoiceId", invoiceId)

      // Add affiliate code to the form data if it exists
      if (affiliateCode) {
        formData.append("affiliateCode", affiliateCode)
      }

      const response = await fetch("/api/payments/upload-receipt", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/invoice/${invoiceId}/confirmation`)
      } else {
        setError(data.error || "Failed to upload receipt")
      }
    } catch (err) {
      setError("An error occurred while uploading your receipt")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Payment Receipt</CardTitle>
        <CardDescription>Please upload your payment receipt for ${amount.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt">Payment Receipt</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Submit Payment Receipt"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        Your receipt will be reviewed by our team
      </CardFooter>
    </Card>
  )
}

