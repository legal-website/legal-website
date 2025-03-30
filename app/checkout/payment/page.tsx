"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Loader2, AlertCircle, Wallet, BanknoteIcon as Bank } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { PaymentMethod } from "@/types/payment-method"
import { cn } from "@/lib/utils"

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true)

        // Fetch bank accounts
        const bankResponse = await fetch("/api/payment-methods?type=bank")

        // If unauthorized, show a fallback payment method
        if (bankResponse.status === 401) {
          // Create a fallback payment method
          const fallbackMethods: PaymentMethod[] = [
            {
              id: "default-bank",
              name: "Default Bank Account",
              type: "bank",
              accountTitle: "Orizen Inc.",
              accountNumber: "1234567890",
              bankName: "Example Bank",
              isActive: true,
              createdAt: new Date().toISOString(),
              createdBy: "system",
              updatedAt: new Date().toISOString(),
            },
            {
              id: "default-wallet",
              name: "Default Mobile Wallet",
              type: "mobile_wallet",
              accountTitle: "Orizen Inc.",
              accountNumber: "9876543210",
              providerName: "EasyPay",
              isActive: true,
              createdAt: new Date().toISOString(),
              createdBy: "system",
              updatedAt: new Date().toISOString(),
            },
          ]

          setPaymentMethods(fallbackMethods)
          setSelectedPaymentMethod(fallbackMethods[0].id)
          setLoadingPaymentMethods(false)
          return
        }

        if (!bankResponse.ok) {
          throw new Error("Failed to fetch bank payment methods")
        }

        const bankData = await bankResponse.json()

        // Fetch mobile wallets
        const walletResponse = await fetch("/api/payment-methods?type=mobile_wallet")
        if (!walletResponse.ok) {
          throw new Error("Failed to fetch mobile wallet payment methods")
        }

        const walletData = await walletResponse.json()

        // Combine the results
        const allMethods = [...(bankData.paymentMethods || []), ...(walletData.paymentMethods || [])]

        setPaymentMethods(allMethods)

        // Set the first payment method as selected by default if available
        if (allMethods.length > 0) {
          setSelectedPaymentMethod(allMethods[0].id)
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error)
        // Create a fallback payment method
        const fallbackMethods: PaymentMethod[] = [
          {
            id: "default-bank",
            name: "Default Bank Account",
            type: "bank",
            accountTitle: "Orizen Inc.",
            accountNumber: "1234567890",
            bankName: "Example Bank",
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: "system",
            updatedAt: new Date().toISOString(),
          },
          {
            id: "default-wallet",
            name: "Default Mobile Wallet",
            type: "mobile_wallet",
            accountTitle: "Orizen Inc.",
            accountNumber: "9876543210",
            providerName: "EasyPay",
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: "system",
            updatedAt: new Date().toISOString(),
          },
        ]

        setPaymentMethods(fallbackMethods)
        setSelectedPaymentMethod(fallbackMethods[0].id)
      } finally {
        setLoadingPaymentMethods(false)
      }
    }

    fetchPaymentMethods()
  }, [toast])

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

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method before continuing.",
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

      // Find the selected payment method
      const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod)

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
          currency: currencyInfo,
          paymentMethod: selectedMethod
            ? {
                id: selectedMethod.id,
                name: selectedMethod.name,
                type: selectedMethod.type,
              }
            : null,
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

  // Get provider color for mobile wallets
  const getProviderColor = (provider?: string) => {
    if (!provider) return "bg-gray-100"

    switch (provider.toLowerCase()) {
      case "jazzcash":
        return "bg-red-100 text-red-800 border-red-200"
      case "easypaisa":
        return "bg-green-100 text-green-800 border-green-200"
      case "nayapay":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "sadapay":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Filter payment methods by type
  const bankAccounts = paymentMethods.filter((method) => method.type === "bank")
  const mobileWallets = paymentMethods.filter((method) => method.type === "mobile_wallet")

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
            <CardContent>
              {loadingPaymentMethods ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No payment methods available. Please contact support.</p>
                </div>
              ) : (
                <Tabs defaultValue="bank" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="bank" disabled={bankAccounts.length === 0}>
                      <Bank className="mr-2 h-4 w-4" />
                      Bank Accounts
                    </TabsTrigger>
                    <TabsTrigger value="mobile_wallet" disabled={mobileWallets.length === 0}>
                      <Wallet className="mr-2 h-4 w-4" />
                      Mobile Wallets
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank" className="space-y-4">
                    {bankAccounts.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          selectedPaymentMethod === method.id
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "hover:border-blue-200 hover:bg-blue-50/50",
                        )}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Bank className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium">{method.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">{method.bankName}</span>
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2",
                                selectedPaymentMethod === method.id ? "border-blue-500 bg-blue-500" : "border-gray-300",
                              )}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                          <p>
                            <span className="font-medium">Account Title:</span> {method.accountTitle}
                          </p>
                          <p>
                            <span className="font-medium">Account Number:</span> {method.accountNumber}
                          </p>
                          {method.iban && (
                            <p>
                              <span className="font-medium">IBAN:</span> {method.iban}
                            </p>
                          )}
                          {method.swiftCode && (
                            <p>
                              <span className="font-medium">Swift Code:</span> {method.swiftCode}
                            </p>
                          )}
                          {method.branchName && (
                            <p>
                              <span className="font-medium">Branch:</span> {method.branchName}
                              {method.branchCode && ` (${method.branchCode})`}
                            </p>
                          )}
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
                    ))}
                  </TabsContent>

                  <TabsContent value="mobile_wallet" className="space-y-4">
                    {mobileWallets.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          selectedPaymentMethod === method.id
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : "hover:border-indigo-200 hover:bg-indigo-50/50",
                        )}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Wallet className="h-5 w-5 text-indigo-600 mr-2" />
                            <span className="font-medium">{method.name}</span>
                          </div>
                          <div className="flex items-center">
                            {method.providerName && (
                              <Badge variant="outline" className={`mr-2 ${getProviderColor(method.providerName)}`}>
                                {method.providerName.charAt(0).toUpperCase() + method.providerName.slice(1)}
                              </Badge>
                            )}
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2",
                                selectedPaymentMethod === method.id
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300",
                              )}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                          <p>
                            <span className="font-medium">Account Title:</span> {method.accountTitle}
                          </p>
                          <p>
                            <span className="font-medium">Account Number:</span> {method.accountNumber}
                          </p>
                          {method.iban && (
                            <p>
                              <span className="font-medium">IBAN:</span> {method.iban}
                            </p>
                          )}
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
                    ))}
                  </TabsContent>
                </Tabs>
              )}

              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2">Other Payment Options</h3>
                <p className="text-sm text-gray-600">
                  For credit/debit card payments or other payment methods, please contact our support team at
                  support@orizen.com or call +1 123 456 789.
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
                  disabled={!uploadedFile || loading || !selectedPaymentMethod}
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
                {checkoutData.items
                  .filter(
                    (item: any) => item.type !== "currency-info" && item.tier !== "CURRENCY_INFO" && !item._hidden,
                  )
                  .map((item: any) => (
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

