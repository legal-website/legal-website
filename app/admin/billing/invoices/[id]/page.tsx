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
import { sendInvoiceEmail } from "@/app/actions/send-email"

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
  const [sendingEmail, setSendingEmail] = useState(false)
  const { addNotification } = useNotifications()

  // Update the rejection dialog to include a text area for notes

  // First, add a new state for rejection reason
  const [rejectionReason, setRejectionReason] = useState("")

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
    if (!invoice || sendingEmail) return

    setSendingEmail(true)

    try {
      // Use the server action to send the email
      const result = await sendInvoiceEmail(invoice.id, invoice.customerEmail, invoice.invoiceNumber)

      if (result.success) {
        // Add notification
        addNotification(invoiceEvents.emailSent(invoice.invoiceNumber, invoice.customerEmail))

        toast({
          title: "Email Sent",
          description: `Invoice has been sent to ${invoice.customerEmail}.`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error("Email error:", error)
      toast({
        title: "Failed to send email",
        description: error.message || "Something went wrong. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
      default:
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
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

  // Then update the handleRejectPayment function to include the reason
  const handleRejectPayment = async () => {
    if (!invoice) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
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
          rejectionReason: rejectionReason,
        }
      })

      // Add notification
      addNotification(invoiceEvents.paymentRejected(invoice.invoiceNumber, invoice.customerName))

      setRejectDialogOpen(false)
      setRejectionReason("") // Reset the reason
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
      <div className="p-4 sm:p-6 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm sm:text-base">Loading invoice details...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Invoice Not Found</h1>
        <p className="text-sm sm:text-base mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/admin/invoices")}>Return to Invoices</Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto mb-20 sm:mb-40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            className="w-full sm:w-auto justify-start text-xs sm:text-sm"
            onClick={() => router.push("/admin/invoices")}
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Back to Invoices
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Printer className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="text-xs sm:text-sm flex-1 sm:flex-none"
          >
            {sendingEmail ? (
              <>
                <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Email
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Download
          </Button>
        </div>
      </div>

      {invoice.status === "pending" && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
            onClick={() => setApproveDialogOpen(true)}
          >
            Approve Payment
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm"
            onClick={() => setRejectDialogOpen(true)}
          >
            Reject Payment
          </Button>
        </div>
      )}

      {invoice.status !== "pending" && (
        <div className="mb-4 sm:mb-6">
          <Button onClick={() => setStatusDialogOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
            Update Status
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              {getStatusIcon(invoice.status)}
              <span className="ml-2 text-base sm:text-lg font-medium capitalize">{invoice.status}</span>
            </div>
            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm">
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
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p className="font-medium">{invoice.customerName}</p>
              <p className="break-words">{invoice.customerEmail}</p>
              {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
              {invoice.customerCompany && <p>{invoice.customerCompany}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {invoice.customerAddress ? (
              <div className="space-y-1 text-xs sm:text-sm">
                <p>{invoice.customerAddress}</p>
                <p>
                  {invoice.customerCity}
                  {invoice.customerState && `, ${invoice.customerState}`} {invoice.customerZip}
                </p>
                <p>{invoice.customerCountry}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-xs sm:text-sm">No billing address provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm font-medium">Item</th>
                    <th className="text-right py-2 sm:py-3 px-4 text-xs sm:text-sm font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 sm:py-3 px-4">
                        <div className="font-medium text-xs sm:text-sm">{item.tier} Package</div>
                        {item.state && item.stateFee && (
                          <div className="text-xs text-gray-600">{item.state} State Filing Fee</div>
                        )}
                        {item.discount && <div className="text-xs text-green-600">Discount</div>}
                      </td>
                      <td className="text-right py-2 sm:py-3 px-4">
                        <div className="text-xs sm:text-sm">{formatCurrency(item.price)}</div>
                        {item.state && item.stateFee && (
                          <div className="text-xs text-gray-600">{formatCurrency(item.stateFee)}</div>
                        )}
                        {item.discount && (
                          <div className="text-xs text-green-600">-{formatCurrency(item.discount)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-3 sm:py-4 px-4 font-bold text-xs sm:text-sm">Total</td>
                    <td className="text-right py-3 sm:py-4 px-4 font-bold text-xs sm:text-sm">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.paymentReceipt && (
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Payment Receipt</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-center">
              {invoice.paymentReceipt.endsWith(".pdf") ? (
                <div className="text-center">
                  <p className="mb-2 text-xs sm:text-sm">PDF Receipt</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(invoice.paymentReceipt, "_blank")}
                    className="flex items-center text-xs sm:text-sm"
                  >
                    <ExternalLink className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> View Receipt
                  </Button>
                </div>
              ) : (
                <div className="w-full overflow-hidden">
                  <img
                    src={invoice.paymentReceipt || "/placeholder.svg"}
                    alt="Payment Receipt"
                    className="max-w-full max-h-64 sm:max-h-96 object-contain rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Payment Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Approve Payment</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to approve this payment? This will notify the customer and allow them to complete
              registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={processingAction} className="text-xs sm:text-sm mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleApprovePayment()
              }}
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            >
              {processingAction ? "Processing..." : "Approve Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Reject Payment</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to reject this payment? This will notify the customer that their payment was not
              accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
              Rejection Reason (optional)
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (will be included in email to customer)"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={processingAction} className="text-xs sm:text-sm mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRejectPayment()
              }}
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            >
              {processingAction ? "Processing..." : "Reject Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Update Invoice Status</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Select a new status for invoice #{invoice.invoiceNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Button
              variant={invoice.status === "pending" ? "default" : "outline"}
              onClick={() => handleUpdateStatus("pending")}
              disabled={updating || invoice.status === "pending"}
              className="text-xs sm:text-sm"
            >
              <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Pending
            </Button>
            <Button
              variant={invoice.status === "paid" ? "default" : "outline"}
              onClick={() => handleUpdateStatus("paid")}
              disabled={updating || invoice.status === "paid"}
              className="text-xs sm:text-sm"
            >
              <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Paid
            </Button>
            <Button
              variant={invoice.status === "cancelled" ? "default" : "outline"}
              onClick={() => handleUpdateStatus("cancelled")}
              disabled={updating || invoice.status === "cancelled"}
              className="text-xs sm:text-sm"
            >
              <AlertCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Cancelled
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating} className="text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

