"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch invoice")
        }
        const data = await response.json()

        // Parse the items JSON string into an array
        if (data.invoice && typeof data.invoice.items === "string") {
          data.invoice.items = JSON.parse(data.invoice.items)
        }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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
                <CheckCircle2 className="mr-1 h-4 w-4" />
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <Clock className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Payment Under Review</h3>
                <p className="text-yellow-700 mb-3">
                  Your payment receipt is currently being reviewed by our team. This typically takes 1-2 business days.
                </p>
                <div className="w-full bg-yellow-200 rounded-full h-2.5 mb-2">
                  <div className="bg-yellow-500 h-2.5 rounded-full w-1/3 animate-pulse"></div>
                </div>
                <p className="text-sm text-yellow-600">
                  We'll notify you by email once your payment is approved. If you have any questions, please contact our
                  support team.
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.status === "paid" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Payment Approved</h3>
                <p className="text-green-700">Your payment has been approved. Thank you for your purchase!</p>
                {invoice.paymentDate && (
                  <p className="text-green-700 text-sm mt-1">
                    Payment processed on{" "}
                    {new Date(invoice.paymentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                <div className="mt-4">
                  <Button
                    onClick={() => router.push(`/register?invoice=${invoice.id}`)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Continue to Registration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {invoice.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Payment Rejected</h3>
                <p className="text-red-700 mb-3">
                  Your payment has been rejected. This may be due to an unclear receipt image or incorrect payment
                  information.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => router.push("/checkout/payment")}
                  >
                    Try Again
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/contact")}>
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {invoice.paymentReceipt && (
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
                      <Download className="mr-2 h-4 w-4" />
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

