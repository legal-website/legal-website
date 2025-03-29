"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Building, CreditCard, Copy, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type BankDetails = {
  id: string
  accountName: string
  accountNumber: string
  routingNumber: string
  bankName: string
  accountType: string
  swiftCode?: string
  branchName?: string
  branchCode?: string
  isDefault?: boolean
}

export default function PaymentMethodPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch bank details
  useEffect(() => {
    const fetchBankDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/user/bank-details")

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          throw new Error(errorData.message || "Failed to fetch bank details")
        }

        const data = await response.json()
        if (data.bankDetails) {
          setBankDetails(data.bankDetails)
        } else {
          // Use default ORIZEN INC details if none returned
          setBankDetails({
            id: "default",
            accountName: "ORIZEN INC",
            accountNumber: "08751010024993",
            routingNumber: "PK51ALFH0875001010024993",
            bankName: "Bank Alfalah",
            accountType: "checking",
            swiftCode: "ALFHPKKAXXX",
            branchName: "EME DHA Br.LHR",
            branchCode: "0875",
            isDefault: true,
          })
        }
      } catch (error) {
        console.error("Error fetching bank details:", error)
        setError(String(error))
        // Use default ORIZEN INC details if there's an error
        setBankDetails({
          id: "default",
          accountName: "ORIZEN INC",
          accountNumber: "08751010024993",
          routingNumber: "PK51ALFH0875001010024993",
          bankName: "Bank Alfalah",
          accountType: "checking",
          swiftCode: "ALFHPKKAXXX",
          branchName: "EME DHA Br.LHR",
          branchCode: "0875",
          isDefault: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBankDetails()
  }, [])

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard`)
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard")
      })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Account Details
          </CardTitle>
          <CardDescription>Use these bank account details for direct deposits and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bankDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 relative group">
                  <p className="text-sm font-medium text-muted-foreground">Account Title</p>
                  <p className="text-lg font-medium">{bankDetails.accountName}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bankDetails.accountName, "Account name")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border rounded-lg p-4 relative group">
                  <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                  <p className="text-lg font-medium">{bankDetails.accountNumber}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bankDetails.accountNumber, "Account number")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border rounded-lg p-4 relative group">
                  <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                  <p className="text-lg font-medium">{bankDetails.bankName}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bankDetails.bankName, "Bank name")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border rounded-lg p-4 relative group">
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <p className="text-lg font-medium capitalize">{bankDetails.accountType}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bankDetails.accountType, "Account type")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {bankDetails.swiftCode && (
                  <div className="border rounded-lg p-4 relative group">
                    <p className="text-sm font-medium text-muted-foreground">Swift Code</p>
                    <p className="text-lg font-medium">{bankDetails.swiftCode}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(bankDetails.swiftCode!, "Swift code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {bankDetails.branchName && (
                  <div className="border rounded-lg p-4 relative group">
                    <p className="text-sm font-medium text-muted-foreground">Branch Name</p>
                    <p className="text-lg font-medium">{bankDetails.branchName}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(bankDetails.branchName!, "Branch name")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {bankDetails.branchCode && (
                  <div className="border rounded-lg p-4 relative group">
                    <p className="text-sm font-medium text-muted-foreground">Branch Code</p>
                    <p className="text-lg font-medium">{bankDetails.branchCode}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(bankDetails.branchCode!, "Branch code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {bankDetails.routingNumber && bankDetails.routingNumber.startsWith("PK") && (
                  <div className="border rounded-lg p-4 relative group">
                    <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                    <p className="text-lg font-medium">{bankDetails.routingNumber}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(bankDetails.routingNumber, "IBAN")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {bankDetails.routingNumber && !bankDetails.routingNumber.startsWith("PK") && (
                  <div className="border rounded-lg p-4 relative group">
                    <p className="text-sm font-medium text-muted-foreground">Routing Number</p>
                    <p className="text-lg font-medium">{bankDetails.routingNumber}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(bankDetails.routingNumber, "Routing number")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-6 bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Payment Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  When making a payment, please include your account number or invoice number in the payment reference.
                  This will help us match your payment to your account.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No Bank Account Available</h3>
                <p className="text-sm text-muted-foreground">Please contact support for payment instructions</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

