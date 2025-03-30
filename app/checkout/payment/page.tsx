"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [currencyInfo, setCurrencyInfo] = useState<{
    code: string
    symbol: string
    flag: string
    rate: number
    convertedTotal: number
  } | null>(null)

  useEffect(() => {
    // Get checkout data from session storage
    const storedData = sessionStorage.getItem("checkoutData")
    if (!storedData) {
      // Redirect to checkout if no data
      router.push("/checkout")
      return
    }

    try {
      const parsedData = JSON.parse(storedData)
      setCheckoutData(parsedData)

      // Extract currency information
      if (parsedData.currency) {
        setCurrencyInfo(parsedData.currency)
        console.log("Currency information:", parsedData.currency)
      }
    } catch (error) {
      console.error("Error parsing checkout data:", error)
      toast({
        title: "Error",
        description: "There was a problem loading your checkout information. Please try again.",
        variant: "destructive",
      })
      router.push("/checkout")
    }
  }, [router, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)

      // Create a preview URL
      const fileUrl = URL.createObjectURL(file)
      setUploadedFileUrl(fileUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadedFile) {
      toast({
        title: "Missing receipt",
        description: "Please upload your payment receipt before continuing.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Upload the receipt file
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const uploadResponse = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload receipt")
      }

      const uploadData = await uploadResponse.json()
      const receiptUrl = uploadData.url

      // Create the invoice with the receipt URL
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
          affiliateCode: checkoutData.affiliateCode,
          couponCode: checkoutData.coupon?.code,
          currency: currencyInfo, // Pass the currency information
        }),
      })

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json()
        throw new Error(errorData.message || "Failed to create invoice")
      }

      const invoiceData = await invoiceResponse.json()

      // Clear checkout data from session storage
      sessionStorage.removeItem("checkoutData")

      // Redirect to the invoice page
      router.push(`/invoice/${invoiceData.invoice.id}`)
    } catch (error: any) {
      console.error("Payment submission error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format prices in the selected currency
  const formatPrice = (amount: number) => {
    if (currencyInfo) {
      return `${currencyInfo.symbol}${(amount * currencyInfo.rate).toFixed(2)}`
    }
    return `$${amount.toFixed(2)}`
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
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Currency indicator at the top of the page */}
      {currencyInfo && (
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-[7px] bg-[#21C582] text-white">
            <Image
              src={currencyInfo.flag || "/placeholder.svg"}
              alt={`${currencyInfo.code} flag`}
              width={20}
              height={15}
              className="mr-2"
            />
            <span>Paying in {currencyInfo.code}</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          <div className="bg-blue-50 p-4 rounded-md flex items-start mb-6">
            <AlertCircle className="text-blue-500 mr-2 mt-0.5" size={18} />
            <div>
              <p className="text-blue-800 font-medium">Manual Payment Process</p>
              <p className="text-blue-700 text-sm">
                Please make your payment using your preferred method and upload the receipt below. Our team will verify
                your payment within 1-2 business days.
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Bank Transfer</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Please transfer the exact amount to the following bank account:
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>
                    <span className="font-medium">Bank Name:</span> Example Bank
                  </p>
                  <p>
                    <span className="font-medium">Account Name:</span> Orizen Inc.
                  </p>
                  <p>
                    <span className="font-medium">Account Number:</span> 1234567890
                  </p>
                  <p>
                    <span className="font-medium">Routing Number:</span> 987654321
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span>{" "}
                    {currencyInfo ? (
                      <span className="flex items-center">
                        {formatPrice(checkoutData.total)}
                        <Image
                          src={currencyInfo.flag || "/placeholder.svg"}
                          alt={currencyInfo.code}
                          width={16}
                          height={12}
                          className="ml-1"
                        />
                      </span>
                    ) : (
                      `$${checkoutData.total.toFixed(2)}`
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Reference:</span> {checkoutData.customer.email}
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Credit/Debit Card</h3>
                <p className="text-sm text-gray-600">
                  For card payments, please contact our support team at support@orizen.com or call +1 123 456 789.
                </p>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Other Payment Methods</h3>
                <p className="text-sm text-gray-600">
                  We also accept PayPal, Venmo, and cryptocurrency payments. Please contact our support team for
                  details.
                </p>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    After making your payment, please upload a screenshot or PDF of your payment receipt.
                  </p>

                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      uploadedFileUrl ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-blue-400"
                    } transition-colors cursor-pointer`}
                    onClick={() => document.getElementById("receipt-upload")?.click()}
                  >
                    <input
                      type="file"
                      id="receipt-upload"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />

                    {uploadedFileUrl ? (
                      <>
                        {uploadedFile?.type.startsWith("image/") ? (
                          <div className="mb-2">
                            <img
                              src={uploadedFileUrl || "/placeholder.svg"}
                              alt="Receipt preview"
                              className="max-h-48 mx-auto object-contain"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 p-4 bg-green-100 rounded-md">
                            <p className="font-medium">PDF Uploaded</p>
                            <p className="text-sm">{uploadedFile?.name}</p>
                          </div>
                        )}
                        <p className="text-green-600 font-medium">Receipt uploaded successfully!</p>
                        <p className="text-sm text-gray-500 mt-1">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="font-medium">Click to upload your payment receipt</p>
                        <p className="text-sm text-gray-500 mt-1">Supports images and PDF files</p>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#21C582] hover:bg-[#1eac73] text-white"
                  disabled={!uploadedFile || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Submit Payment Receipt
                      {currencyInfo && (
                        <Image
                          src={currencyInfo.flag || "/placeholder.svg"}
                          alt={currencyInfo.code}
                          width={20}
                          height={15}
                          className="ml-2"
                        />
                      )}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Summary</span>
                {currencyInfo && (
                  <div className="flex items-center text-sm font-normal">
                    <Image
                      src={currencyInfo.flag || "/placeholder.svg"}
                      alt={currencyInfo.code}
                      width={20}
                      height={15}
                      className="mr-1"
                    />
                    <span>{currencyInfo.code}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkoutData.items.map((item: any) => (
                  <div key={item.id} className="border-b pb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.tier} Package</span>
                      <div className="flex items-center">
                        <span>{formatPrice(item.price)}</span>
                        {currencyInfo && (
                          <Image
                            src={currencyInfo.flag || "/placeholder.svg"}
                            alt={currencyInfo.code}
                            width={16}
                            height={12}
                            className="ml-1"
                          />
                        )}
                      </div>
                    </div>

                    {item.state && item.stateFee && (
                      <div className="flex justify-between mt-1 text-sm text-gray-600">
                        <span>{item.state} State Filing Fee</span>
                        <span>{formatPrice(item.stateFee)}</span>
                      </div>
                    )}

                    {item.discount && (
                      <div className="flex justify-between mt-1 text-sm text-[#22c984]">
                        <span>Discounted Price</span>
                        <span>{formatPrice(item.discount)}</span>
                      </div>
                    )}
                  </div>
                ))}

                {checkoutData.discount > 0 && (
                  <div className="flex justify-between text-green-600 pt-2">
                    <span>Discount</span>
                    <div className="flex items-center">
                      <span>-{formatPrice(checkoutData.discount)}</span>
                      {currencyInfo && (
                        <Image
                          src={currencyInfo.flag || "/placeholder.svg"}
                          alt={currencyInfo.code}
                          width={16}
                          height={12}
                          className="ml-1"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <div className="flex items-center">
                    {currencyInfo && (
                      <Image
                        src={currencyInfo.flag || "/placeholder.svg"}
                        alt={currencyInfo.code}
                        width={20}
                        height={15}
                        className="mr-1"
                      />
                    )}
                    <span>{formatPrice(checkoutData.total)}</span>
                  </div>
                </div>

                {currencyInfo && currencyInfo.code !== "USD" && (
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Original price: ${checkoutData.total.toFixed(2)} USD</p>
                    <p>
                      Exchange rate: 1 USD = {currencyInfo.rate} {currencyInfo.code}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {checkoutData.customer.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {checkoutData.customer.email}
                  </p>
                  {checkoutData.customer.phone && (
                    <p>
                      <span className="font-medium">Phone:</span> {checkoutData.customer.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions or need assistance with your payment, please contact our support team.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => window.open("mailto:support@orizen.com")}>
                Email Support
              </Button>
              <Button variant="outline" onClick={() => window.open("tel:+11234567890")}>
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

