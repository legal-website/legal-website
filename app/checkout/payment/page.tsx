"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Remove cart context dependency if it's causing issues
// import { useCart } from "@/context/cart-context"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  // Replace cart context with local state if needed
  // const { clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Bank account details
  const bankDetails = {
    accountName: "Your Company Name",
    accountNumber: "1234567890",
    routingNumber: "987654321",
    bankName: "Example Bank",
    swiftCode: "EXAMPLEXXX",
  }

  useEffect(() => {
    // Safely get checkout data from session storage with error handling
    try {
      // Get checkout data from session storage
      const storedData = typeof window !== "undefined" ? sessionStorage.getItem("checkoutData") : null

      if (!storedData) {
        // Handle missing data gracefully
        console.log("No checkout data found in session storage")
        return
      }

      const parsedData = JSON.parse(storedData)
      setCheckoutData(parsedData)
    } catch (error) {
      console.error("Error accessing or parsing checkout data:", error)
      // Don't redirect immediately, let the user see the error
    }
  }, [])

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
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try manually selecting the text.",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async () => {
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

    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append("receipt", file)

      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

      // Upload receipt to Cloudinary
      const uploadResponse = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload receipt")
      }

      const uploadData = await uploadResponse.json()
      const receiptUrl = uploadData.url

      // Create invoice with receipt URL
      const invoiceResponse = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: checkoutData.customer,
          items: checkoutData.items,
          total: checkoutData.total,
          paymentReceipt: receiptUrl,
        }),
      })

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json()
        throw new Error(errorData.error || "Failed to create invoice")
      }

      const invoiceData = await invoiceResponse.json()

      // Clear checkout data
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("checkoutData")
        // Only clear cart if the function exists
        // if (typeof clearCart === 'function') clearCart()
      }

      // Show success message
      toast({
        title: "Payment submitted",
        description: "Your payment receipt has been uploaded successfully. We'll process your order shortly.",
      })

      // Redirect to success page
      router.push(`/invoice/${invoiceData.invoice.id}`)
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Show a simple loading state if data isn't available yet
  if (!checkoutData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4">Loading payment information...</h1>
          <p className="mb-4">If you're not redirected automatically, please go back to the checkout page.</p>
          <Button onClick={() => router.push("/checkout")}>Return to Checkout</Button>
        </div>
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
                {checkoutData.items && Array.isArray(checkoutData.items) ? (
                  checkoutData.items.map((item: any, index: number) => (
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
                  ))
                ) : (
                  <p>No items in order</p>
                )}

                <div className="pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${checkoutData.total || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="text-sm space-y-1">
                  {checkoutData.customer ? (
                    <>
                      <p>
                        <span className="text-gray-500">Name:</span> {checkoutData.customer.name || "N/A"}
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span> {checkoutData.customer.email || "N/A"}
                      </p>
                      {checkoutData.customer.phone && (
                        <p>
                          <span className="text-gray-500">Phone:</span> {checkoutData.customer.phone}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>No customer information available</p>
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

