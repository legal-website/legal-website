"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BanknoteIcon as Bank, Wallet, Copy, CheckCircle2 } from "lucide-react"
import type { PaymentMethod } from "@/types/payment-method"

export default function ClientPaymentMethodsPage() {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("bank")

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/payment-methods")
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods")
      }
      const data = await response.json()
      setPaymentMethods(data.paymentMethods)
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load payment methods on mount
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  // Handle copying field to clipboard
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Set copied state for this field
        setCopiedFields((prev) => ({ ...prev, [fieldId]: true }))

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopiedFields((prev) => ({ ...prev, [fieldId]: false }))
        }, 2000)

        toast({
          title: "Copied!",
          description: "Text copied to clipboard",
          duration: 2000,
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy text",
          variant: "destructive",
        })
      },
    )
  }

  // Filter payment methods by type
  const bankAccounts = paymentMethods.filter((method) => method.type === "bank")
  const mobileWallets = paymentMethods.filter((method) => method.type === "mobile_wallet")

  // Get provider color
  const getProviderColor = (provider?: string | null) => {
    if (!provider) return "bg-gray-100 text-gray-800"

    switch (provider) {
      case "jazzcash":
        return "bg-orange-100 text-orange-800"
      case "easypaisa":
        return "bg-green-100 text-green-800"
      case "nayapay":
        return "bg-purple-100 text-purple-800"
      case "sadapay":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-gray-500 mt-2">Use these payment methods to make payments to our company.</p>
      </div>

      <Tabs defaultValue="bank" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="bank">
            <Bank className="mr-2 h-4 w-4" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="mobile_wallet">
            <Wallet className="mr-2 h-4 w-4" />
            Mobile Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <Bank className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No bank accounts available</h3>
              <p className="mt-1 text-sm text-gray-500">Please contact support for payment information.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((method) => (
                <Card key={method.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Bank className="mr-2 h-5 w-5" />
                      {method.name}
                    </CardTitle>
                    <CardDescription>{method.bankName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center group">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Account Title</span>
                          <p className="font-medium">{method.accountTitle}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(method.accountTitle, `title-${method.id}`)}
                        >
                          {copiedFields[`title-${method.id}`] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex justify-between items-center group">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Account Number</span>
                          <p className="font-medium">{method.accountNumber}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(method.accountNumber, `number-${method.id}`)}
                        >
                          {copiedFields[`number-${method.id}`] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {method.iban && (
                        <div className="flex justify-between items-center group">
                          <div>
                            <span className="text-sm font-medium text-gray-500">IBAN</span>
                            <p className="font-medium">{method.iban}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(method.iban as string, `iban-${method.id}`)}
                          >
                            {copiedFields[`iban-${method.id}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {method.swiftCode && (
                        <div className="flex justify-between items-center group">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Swift Code</span>
                            <p className="font-medium">{method.swiftCode}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(method.swiftCode as string, `swift-${method.id}`)}
                          >
                            {copiedFields[`swift-${method.id}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {method.branchName && (
                        <div className="flex justify-between items-center group">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Branch</span>
                            <p className="font-medium">{method.branchName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(method.branchName as string, `branch-${method.id}`)}
                          >
                            {copiedFields[`branch-${method.id}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {method.branchCode && (
                        <div className="flex justify-between items-center group">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Branch Code</span>
                            <p className="font-medium">{method.branchCode}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(method.branchCode as string, `branchCode-${method.id}`)}
                          >
                            {copiedFields[`branchCode-${method.id}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mobile_wallet" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mobileWallets.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <Wallet className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No mobile wallets available</h3>
              <p className="mt-1 text-sm text-gray-500">Please contact support for payment information.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mobileWallets.map((method) => (
                <Card key={method.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <Wallet className="mr-2 h-5 w-5" />
                        {method.name}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${getProviderColor(method.providerName)}`}>
                        {method.providerName
                          ? method.providerName.charAt(0).toUpperCase() + method.providerName.slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center group">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Account Title</span>
                          <p className="font-medium">{method.accountTitle}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(method.accountTitle, `title-${method.id}`)}
                        >
                          {copiedFields[`title-${method.id}`] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex justify-between items-center group">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Account Number</span>
                          <p className="font-medium">{method.accountNumber}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(method.accountNumber, `number-${method.id}`)}
                        >
                          {copiedFields[`number-${method.id}`] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {method.iban && (
                        <div className="flex justify-between items-center group">
                          <div>
                            <span className="text-sm font-medium text-gray-500">IBAN</span>
                            <p className="font-medium">{method.iban}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(method.iban as string, `iban-${method.id}`)}
                          >
                            {copiedFields[`iban-${method.id}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

