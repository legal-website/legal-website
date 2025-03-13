"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Printer, Mail, ExternalLink, Check, AlertCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useNotifications } from "@/components/admin/header"
import { invoiceEvents } from "@/lib/invoice-notifications"

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

export default function AdminInvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const { addNotification } = useNotifications()

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/login?callbackUrl=/admin/invoices")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [session, router, toast])

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/invoices/${params.id}`)
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

    if (session && ((session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN")) {
      fetchInvoice()
    }
  }, [params.id, session, toast])

  const handleUpdateStatus = async (newStatus: string) => {
    if (!invoice) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update invoice status")
      }

      const data = await response.json()
      setInvoice((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: newStatus as "pending" | "paid" | "cancelled",
        }
      })

      // Add notification
      addNotification(invoiceEvents.invoiceStatusUpdated(invoice.invoiceNumber, newStatus))

      setStatusDialogOpen(false)
      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to ${newStatus}.`,
      })
    } catch (error: any) {
      console.error("Update error:", error)
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/send-email`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      // Add notification
      addNotification(invoiceEvents.emailSent(invoice.invoiceNumber, invoice.customerEmail))

      toast({
        title: "Email Sent",
        description: `Invoice has been sent to ${invoice.customerEmail}.`,
      })
    } catch (error: any) {
      console.error("Email error:", error)
      toast({
        title: "Failed to send email",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Check className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const handleApprovePayment = async () => {
    if (!invoice) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve payment")
      }

      const data = await response.json()
      setInvoice((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: "paid",
          paymentDate: new Date().toISOString(),
        }
      })

      // Add notification
      addNotification(invoiceEvents.paymentApproved(invoice.invoiceNumber, invoice.customerName))

      setApproveDialogOpen(false)
      toast({
        title: "Payment Approved",
        description: "The customer has been notified and can now complete registration.",
      })
    } catch (error: any) {
      console.error("Approval error:", error)
      toast({
        title: "Approval failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!invoice) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/reject`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reject payment")
      }

      const data = await response.json()
      setInvoice((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: "cancelled",
        }
      })

      // Add notification
      addNotification(invoiceEvents.paymentRejected(invoice.invoiceNumber, invoice.customerName))

      setRejectDialogOpen(false)
      toast({
        title: "Payment Rejected",
        description: "The customer has been notified of the rejection.",
      })
    } catch (error: any) {
      console.error("Rejection error:", error)
      toast({
        title: "Rejection failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // If not admin, don't render the page
  if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
    return null
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading invoice details...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
        <p className="mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/admin/invoices")}>Return to Invoices</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-4" onClick={() => router.push("/admin/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
          <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" /> Send Email
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>

          {invoice.status === "pending" && (
            <>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproveDialogOpen(true)}>
                Approve Payment
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setRejectDialogOpen(true)}
              >
                Reject Payment
              </Button>
            </>
          )}

          {invoice.status !== "pending" && <Button onClick={() => setStatusDialogOpen(true)}>Update Status</Button>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatusIcon(invoice.status)}
              <span className="ml-2 text-lg font-medium capitalize">{invoice.status}</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created Date:</span>
                <span>
                  {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {invoice.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Date:</span>
                  <span>
                    {new Date(invoice.paymentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold">{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{invoice.customerName}</p>
              <p>{invoice.customerEmail}</p>
              {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
              {invoice.customerCompany && <p>{invoice.customerCompany}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.customerAddress ? (
              <div className="space-y-1">
                <p>{invoice.customerAddress}</p>
                <p>
                  {invoice.customerCity}
                  {invoice.customerState && `, ${invoice.customerState}`} {invoice.customerZip}
                </p>
                <p>{invoice.customerCountry}</p>
              </div>
            ) : (
              <p className="text-gray-500">No billing address provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
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
                      {item.discount && <div className="text-sm text-green-600">-{formatCurrency(item.discount)}</div>}
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
                  <Button
                    variant="outline"
                    onClick={() => window.open(invoice.paymentReceipt, "_blank")}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> View Receipt
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

      {/* Approve Payment Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this payment? This will notify the customer and allow them to complete
              registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleApprovePayment()
              }}
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingAction ? "Processing..." : "Approve Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this payment? This will notify the customer that their payment was not
              accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRejectPayment()
              }}
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingAction ? "Processing..." : "Reject Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

