"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  CheckCircle,
  X,
  Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// First, let's define a proper interface for the invoice item
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
}

// Then define the full invoice interface
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
  status: string
  items: InvoiceItem[]
  paymentReceipt?: string
  paymentDate?: string
  createdAt: string
  updatedAt: string
  userId?: string
}

export default function InvoicesAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/invoices")

      if (!response.ok) {
        throw new Error("Failed to fetch invoices")
      }

      const data = await response.json()
      setInvoices(data.invoices)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices
    .filter((invoice) => {
      // Filter by search query
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status tab
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "paid" && invoice.status === "paid") ||
        (activeTab === "pending" && invoice.status === "pending") ||
        (activeTab === "cancelled" && invoice.status === "cancelled")

      return matchesSearch && matchesTab
    })
    .sort((a, b) => {
      // Sort by selected order
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "highest":
          return b.amount - a.amount
        case "lowest":
          return a.amount - b.amount
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  const confirmDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setShowDeleteDialog(true)
  }

  const deleteInvoice = async () => {
    if (!invoiceToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/invoices/${invoiceToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      // Remove the invoice from the local state
      setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== invoiceToDelete.id))

      toast({
        title: "Invoice deleted",
        description: `Invoice ${invoiceToDelete.invoiceNumber} has been deleted successfully.`,
      })

      // Close the dialog
      setShowDeleteDialog(false)

      // If the deleted invoice is currently being viewed, close that dialog too
      if (selectedInvoice && selectedInvoice.id === invoiceToDelete.id) {
        setShowInvoiceDialog(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setInvoiceToDelete(null)
    }
  }

  const approvePayment = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to approve payment")
      }

      // Update the invoice in the local state
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status: "paid", paymentDate: new Date().toISOString() } : invoice,
        ),
      )

      // Update the selected invoice if it's open
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          status: "paid",
          paymentDate: new Date().toISOString(),
        })
      }

      toast({
        title: "Payment approved",
        description: "The payment has been approved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const rejectPayment = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/reject`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reject payment")
      }

      // Update the invoice in the local state
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: "cancelled" } : invoice)),
      )

      // Update the selected invoice if it's open
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          status: "cancelled",
        })
      }

      toast({
        title: "Payment rejected",
        description: "The payment has been rejected.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportInvoices = () => {
    // Create CSV header
    let csv = "Invoice Number,Customer,Email,Amount,Date,Status\n"

    // Add each invoice as a row
    filteredInvoices.forEach((invoice) => {
      csv += `${invoice.invoiceNumber},"${invoice.customerName}","${invoice.customerEmail}",${invoice.amount},${new Date(invoice.createdAt).toLocaleDateString()},${invoice.status}\n`
    })

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "invoices.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <p>Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all client invoices</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportInvoices}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" onClick={() => setSearchQuery("")}>
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="outline" className="flex-1" onClick={fetchInvoices}>
            <Clock className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <div className="mt-2 text-sm text-gray-500">
          {activeTab === "all" && "Showing all invoices"}
          {activeTab === "paid" && "Showing paid invoices only"}
          {activeTab === "pending" && "Showing pending invoices only"}
          {activeTab === "cancelled" && "Showing cancelled invoices only"}
          {filteredInvoices.length > 0 && ` (${filteredInvoices.length} found)`}
        </div>
      </Tabs>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-sm">Invoice</th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th className="text-left p-4 font-medium text-sm">Amount</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Receipt</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{invoice.customerName}</p>
                        <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${invoice.amount.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">{format(new Date(invoice.createdAt), "MMM d, yyyy")}</td>
                    <td className="p-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="p-4">
                      {invoice.paymentReceipt ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                            View Receipt
                          </a>
                        </Button>
                      ) : (
                        <span className="text-gray-500">No receipt</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => viewInvoiceDetails(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>

                        {invoice.status === "pending" && invoice.paymentReceipt && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => approvePayment(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => rejectPayment(invoice.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => confirmDeleteInvoice(invoice)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row md:justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold mb-1">Invoice</h3>
                  <p className="text-gray-500">{selectedInvoice.invoiceNumber}</p>
                  <div className="mt-4">
                    <p className="font-medium">Billed To:</p>
                    <p>{selectedInvoice.customerName}</p>
                    <p className="text-gray-500">{selectedInvoice.customerEmail}</p>
                    {selectedInvoice.customerPhone && <p className="text-gray-500">{selectedInvoice.customerPhone}</p>}
                    {selectedInvoice.customerCompany && <p>{selectedInvoice.customerCompany}</p>}
                    {selectedInvoice.customerAddress && (
                      <p>
                        {selectedInvoice.customerAddress},
                        {selectedInvoice.customerCity && ` ${selectedInvoice.customerCity},`}
                        {selectedInvoice.customerState && ` ${selectedInvoice.customerState}`}
                        {selectedInvoice.customerZip && ` ${selectedInvoice.customerZip}`}
                      </p>
                    )}
                    {selectedInvoice.customerCountry && <p>{selectedInvoice.customerCountry}</p>}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <InvoiceStatusBadge status={selectedInvoice.status} />
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p>{format(new Date(selectedInvoice.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  {selectedInvoice.paymentDate && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Date</p>
                      <p>{format(new Date(selectedInvoice.paymentDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-sm">Item</th>
                      <th className="text-right p-2 font-medium text-sm">Price</th>
                      <th className="text-right p-2 font-medium text-sm">Quantity</th>
                      <th className="text-right p-2 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div>
                            <p>{item.tier} Package</p>
                            {item.state && <p className="text-sm text-gray-500">{item.state} State Filing Fee</p>}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <div>
                            <p>${item.price.toFixed(2)}</p>
                            {item.stateFee && <p className="text-sm text-gray-500">${item.stateFee.toFixed(2)}</p>}
                          </div>
                        </td>
                        <td className="p-2 text-right">1</td>
                        <td className="p-2 text-right">
                          ${(item.price + (item.stateFee || 0) - (item.discount || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-medium">
                        Total
                      </td>
                      <td className="p-2 text-right font-bold">${selectedInvoice.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Receipt */}
              {selectedInvoice.paymentReceipt && (
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4">Payment Receipt</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <p>Receipt uploaded by customer</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedInvoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                          View Receipt
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Actions */}
              {selectedInvoice.status === "pending" && selectedInvoice.paymentReceipt && (
                <div className="flex space-x-3 mt-4">
                  <Button
                    onClick={() => approvePayment(selectedInvoice.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Payment
                  </Button>

                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => rejectPayment(selectedInvoice.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Close
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Customer
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={() => confirmDeleteInvoice(selectedInvoice)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {invoiceToDelete?.invoiceNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteInvoice()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
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

