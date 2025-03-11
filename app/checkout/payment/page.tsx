"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"
import { ErrorBoundary } from "@/components/error-boundary"

function PaymentPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bank account details
  const bankDetails = {
    accountName: "Your Company Name",
    accountNumber: "1234567890",
    routingNumber: "987654321",
    bankName: "Example Bank",
    swiftCode: "EXAMPLEXXX",
  }

  useEffect(() => {
    try {
      // Get checkout data from session storage
      const storedData = sessionStorage.getItem("checkoutData")
      if (!storedData) {
        router.push("/checkout")
        return
      }

      const parsedData = JSON.parse(storedData)
      setCheckoutData(parsedData)
    } catch (error) {
      console.error("Error loading checkout data:", error)
      setError("Failed to load checkout data. Please try again.")
    }
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const copyAccountDetails = () => {
    try {
      const detailsText = `
        Account Name: ${bankDetails.accountName}
        Account Number: ${bankDetails.accountNumber}
        Routing Number: ${bankDetails.routingNumber}
        Bank Name: ${bankDetails.bankName}
        SWIFT Code: ${bankDetails.swiftCode}
      `
      navigator.clipboard.writeText(detailsText.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to clipboard",
        description: "Bank account details have been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async () => {
    // Validate inputs
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a receipt file to upload.",
        variant: "destructive",
      })
      return
    }

    if (!checkoutData) {
      toast({
        title: "Missing checkout data",
        description: "Please go back to checkout and try again.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Step 1: Create form data for file upload
      const formData = new FormData()
      formData.append("receipt", file)

      // Step 2: Upload receipt to Cloudinary
      console.log("Uploading receipt file...")
      const uploadResponse = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("Upload response error:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || errorData.message || "Failed to upload receipt")
        } catch (parseError) {
          throw new Error(`Failed to upload receipt: ${errorText}`)
        }
      }

      const uploadData = await uploadResponse.json()
      console.log("Receipt uploaded successfully:", uploadData)

      if (!uploadData.url) {
        throw new Error("No receipt URL returned from server")
      }

      const receiptUrl = uploadData.url

      // Step 3: Create invoice with receipt URL
      console.log("Creating invoice with receipt URL:", receiptUrl)
      const invoiceData = {
        customer: checkoutData.customer,
        items: checkoutData.items,
        total: checkoutData.total,
        paymentReceipt: receiptUrl,
      }

      console.log("Invoice data:", JSON.stringify(invoiceData, null, 2))

      const invoiceResponse = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text()
        console.error("Invoice response error:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || errorData.message || "Failed to create invoice")
        } catch (parseError) {
          throw new Error(`Failed to create invoice: ${errorText}`)
        }
      }

      const invoiceResult = await invoiceResponse.json()
      console.log("Invoice created successfully:", invoiceResult)

      if (!invoiceResult.invoice || !invoiceResult.invoice.id) {
        throw new Error("No invoice ID returned from server")
      }

      // Step 4: Clear cart and checkout data
      clearCart()
      sessionStorage.removeItem("checkoutData")

      // Step 5: Show success message
      toast({
        title: "Payment submitted",
        description: "Your payment receipt has been uploaded successfully. We'll process your order shortly.",
      })

      // Step 6: Redirect to success page
      router.push(`/invoice/${invoiceResult.invoice.id}`)
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Something went wrong. Please try again.")
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading payment page...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-4 text-center">Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/checkout")}>
              Back to Checkout
            </Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!checkoutData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-36 mb-44">
      <Button variant="ghost" className="mb-8" onClick={() => router.push("/checkout")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Checkout
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Payment Instructions */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Direct Bank Transfer</CardTitle>
              <CardDescription>
                Please transfer the exact amount to our bank account and upload your payment receipt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Bank Account Details</h3>
                  <Button variant="outline" size="sm" onClick={copyAccountDetails}>
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Account Name:</span>
                    <span className="font-medium">{bankDetails.accountName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Account Number:</span>
                    <span className="font-medium">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Routing Number:</span>
                    <span className="font-medium">{bankDetails.routingNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-medium">{bankDetails.bankName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">SWIFT Code:</span>
                    <span className="font-medium">{bankDetails.swiftCode}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Important</h4>
                    <p className="text-sm text-amber-700">
                      Please include your name and email in the payment reference. After making the payment, upload your
                      receipt below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Upload Payment Receipt</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop your receipt here, or click to browse</p>
                  <input
                    type="file"
                    id="receipt"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    onChange={handleFileChange}
                  />
                  <Button variant="outline" onClick={() => document.getElementById("receipt")?.click()}>
                    Select File
                  </Button>
                  {file && <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>}
                </div>
              </div>

              <Button
                className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Submit Payment Receipt"}
              </Button>
            </CardContent>
          </Card>
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
                {checkoutData.items.map((item: any, index: number) => (
                  <div key={item.id || index} className="border-b pb-4">
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
                    <span>${checkoutData.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Name:</span> {checkoutData.customer.name}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span> {checkoutData.customer.email}
                  </p>
                  {checkoutData.customer.phone && (
                    <p>
                      <span className="text-gray-500">Phone:</span> {checkoutData.customer.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <ErrorBoundary>
      <PaymentPageContent />
    </ErrorBoundary>
  )
}

