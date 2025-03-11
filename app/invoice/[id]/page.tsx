"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Check, AlertCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerZip?: string
  customerCountry?: string
  amount: number
  status: "pending" | "paid" | "cancelled"
  items: InvoiceItem[]
  paymentReceipt?: string
  paymentDate?: string
  createdAt: string
  updatedAt: string
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch invoice")
        }
        const data = await response.json()
        setInvoice(data.invoice)
      } catch (error) {
        console.error("Error fetching invoice:", error)
        toast({
          title: "Error",
          description: "Could not load invoice details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [params.id, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
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

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("receipt", file)
      formData.append("invoiceId", params.id)

      const response = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload receipt")
      }

      const data = await response.json()

      // Update the invoice state with the new receipt URL
      setInvoice((prev) => {
        if (!prev) return null
        return {
          ...prev,
          paymentReceipt: data.receiptUrl,
          status: "paid",
          paymentDate: new Date().toISOString(),
        }
      })

      toast({
        title: "Success",
        description: "Receipt uploaded successfully. Your payment is being processed.",
      })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-36">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-36 mb-44">
      <Button variant="ghost" className="mb-8" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoice</h1>
            <p className="text-gray-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : invoice.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {invoice.status === "paid" ? (
                <Check className="mr-1 h-4 w-4" />
              ) : invoice.status === "cancelled" ? (
                <AlertCircle className="mr-1 h-4 w-4" />
              ) : (
                <Clock className="mr-1 h-4 w-4" />
              )}
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <span className="font-medium">Name:</span> {invoice.customerName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {invoice.customerEmail}
              </p>
              {invoice.customerPhone && (
                <p>
                  <span className="font-medium">Phone:</span> {invoice.customerPhone}
                </p>
              )}
              {invoice.customerCompany && (
                <p>
                  <span className="font-medium">Company:</span> {invoice.customerCompany}
                </p>
              )}
              {invoice.customerAddress && (
                <div>
                  <p className="font-medium">Address:</p>
                  <p>{invoice.customerAddress}</p>
                  <p>
                    {invoice.customerCity}
                    {invoice.customerState && `, ${invoice.customerState}`} {invoice.customerZip}
                  </p>
                  <p>{invoice.customerCountry}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={
                    invoice.status === "paid"
                      ? "text-green-600"
                      : invoice.status === "cancelled"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </p>
              {invoice.paymentDate && (
                <p>
                  <span className="font-medium">Payment Date:</span>{" "}
                  {new Date(invoice.paymentDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Item</th>
                    <th className="text-right py-3 px-4">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.tier} Package</div>
                        {item.state && item.stateFee && (
                          <div className="text-sm text-gray-600">{item.state} State Filing Fee</div>
                        )}
                        {item.discount && <div className="text-sm text-green-600">Discount</div>}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div>{formatCurrency(item.price)}</div>
                        {item.state && item.stateFee && (
                          <div className="text-sm text-gray-600">{formatCurrency(item.stateFee)}</div>
                        )}
                        {item.discount && (
                          <div className="text-sm text-green-600">-{formatCurrency(item.discount)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-4 px-4 font-bold">Total</td>
                    <td className="text-right py-4 px-4 font-bold">{formatCurrency(invoice.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {invoice.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Please upload your payment receipt to complete your order.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Upload Receipt"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {invoice.status === "paid" && invoice.paymentReceipt && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {invoice.paymentReceipt.endsWith(".pdf") ? (
                  <div className="text-center">
                    <p className="mb-2">PDF Receipt</p>
                    <Button variant="outline" onClick={() => window.open(invoice.paymentReceipt, "_blank")}>
                      View Receipt
                    </Button>
                  </div>
                ) : (
                  <img
                    src={invoice.paymentReceipt || "/placeholder.svg"}
                    alt="Payment Receipt"
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

