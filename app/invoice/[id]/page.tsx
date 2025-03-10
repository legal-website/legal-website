"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { FileUp, CheckCircle, Clock, AlertCircle } from "lucide-react"

// Simplified interface to reduce memory usage
interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: string
  items: any[] // Using any to reduce TypeScript complexity
  paymentReceipt?: string
  createdAt: string
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setReceiptFile(file)
    }
  }

  const uploadReceipt = async () => {
    if (!receiptFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      })
      return
    }

    setUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append("receipt", receiptFile)
      formData.append("invoiceId", params.id)

      const response = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload receipt")
      }

      toast({
        title: "Success",
        description: "Receipt uploaded successfully. Waiting for verification.",
      })

      // Refresh invoice data after successful upload
      const updatedInvoiceResponse = await fetch(`/api/invoices/${params.id}`)
      const updatedInvoiceData = await updatedInvoiceResponse.json()

      if (!updatedInvoiceResponse.ok) {
        throw new Error(updatedInvoiceData.error || "Failed to fetch updated invoice")
      }

      setInvoice(updatedInvoiceData.invoice)
    } catch (error: any) {
      console.error("Error uploading receipt:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingReceipt(false)
    }
  }

  useEffect(() => {
    async function fetchInvoice() {
      try {
        console.log("Fetching invoice with ID:", params.id) // Add logging
        const response = await fetch(`/api/invoices/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch invoice")
        }

        console.log("Invoice data received:", data) // Add logging
        setInvoice(data.invoice)
      } catch (error: any) {
        console.error("Error fetching invoice:", error) // Add logging
        setError(error.message)
        toast({
          title: "Error",
          description: error.message || "Failed to load invoice. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading Invoice...</CardTitle>
            <CardDescription className="text-center">Please wait while we fetch your invoice details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invoice Not Found</CardTitle>
            <CardDescription className="text-center">
              {error || "The requested invoice could not be found."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")} className="bg-[#22c984] hover:bg-[#1eac73] text-white">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl mb-20">
      <Card className="mb-8">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
              <CardDescription>Created on {new Date(invoice.createdAt).toLocaleDateString()}</CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Basic Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">From</h3>
              <div className="text-sm">
                <p className="font-medium">Orizen Inc</p>
                <p>support@orizeninc.com</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Bill To</h3>
              <div className="text-sm">
                <p className="font-medium">{invoice.customerName}</p>
                <p>{invoice.customerEmail}</p>
              </div>
            </div>
          </div>

          {/* Invoice Total */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Total Amount</h3>
              <p className="text-xl font-bold">${invoice.amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Upload Receipt */}
          {invoice.status === "pending" && !invoice.paymentReceipt && (
            <div className="mb-8">
              <h3 className="font-semibold mb-4">Upload Payment Receipt</h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <FileUp className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">Upload your payment receipt to confirm your payment</p>

                <div className="flex flex-col items-center space-y-4">
                  <Label htmlFor="receipt-upload" className="w-full">
                    <div className="flex items-center justify-center w-full">
                      <Button variant="outline" className="mr-2">
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500">{receiptFile ? receiptFile.name : "No file chosen"}</span>
                    </div>
                    <Input
                      id="receipt-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>

                  <Button
                    onClick={uploadReceipt}
                    disabled={!receiptFile || uploadingReceipt}
                    className="bg-[#22c984] hover:bg-[#1eac73] text-white"
                  >
                    {uploadingReceipt ? "Uploading..." : "Upload Receipt"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Already Uploaded */}
          {invoice.paymentReceipt && (
            <div className="mb-8 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-semibold mb-2">Payment Receipt Uploaded</h3>
                  <p className="mb-4">Your payment receipt has been uploaded and is pending verification.</p>

                  {invoice.status === "pending" && (
                    <Button
                      onClick={() => router.push(`/register?invoice=${params.id}`)}
                      className="bg-[#22c984] hover:bg-[#1eac73] text-white"
                    >
                      Continue to Registration
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-6 flex flex-wrap justify-between gap-4">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>

          {invoice.status === "pending" && !invoice.paymentReceipt && (
            <Button
              className="bg-[#22c984] hover:bg-[#1eac73] text-white"
              onClick={() => {
                const receiptUploadElement = document.getElementById("receipt-upload")
                if (receiptUploadElement) {
                  receiptUploadElement.scrollIntoView({ behavior: "smooth" })
                }
              }}
            >
              Pay Now
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </span>
      )
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      )
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      )
  }
}

