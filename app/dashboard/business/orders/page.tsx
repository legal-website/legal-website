"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Download, FileText, Search, ShoppingBag, PenTool, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

// Invoice types
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
  templateId?: string
  type?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: string
  items: InvoiceItem[] | string
  paymentReceipt?: string
  paymentDate?: string
  createdAt: string
  updatedAt: string
  isTemplateInvoice?: boolean
}

// Annual Report types
interface Filing {
  id: string
  deadlineId: string
  deadlineTitle?: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  userNotes: string | null
  adminNotes: string | null
  filedDate: string | null
  dueDate?: string
  createdAt?: string
  deadline?: {
    title: string
    dueDate: string
  } | null
}

// Amendment types
interface Amendment {
  id: string
  type: string
  details: string
  status: string
  createdAt: string
  updatedAt: string
  documentUrl?: string
  receiptUrl?: string
  paymentAmount?: number | string
  notes?: string
}

export default function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("packages")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null)
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showFilingDialog, setShowFilingDialog] = useState(false)
  const [showAmendmentDialog, setShowAmendmentDialog] = useState(false)

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filings, setFilings] = useState<Filing[]>([])
  const [amendments, setAmendments] = useState<Amendment[]>([])

  // Loading states
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingFilings, setLoadingFilings] = useState(true)
  const [loadingAmendments, setLoadingAmendments] = useState(true)

  // Error states
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [filingError, setFilingError] = useState<string | null>(null)
  const [amendmentError, setAmendmentError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
    fetchFilings()
    fetchAmendments()
  }, [])

  // Fetch invoices using the existing API route
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true)
      setInvoiceError(null)

      const response = await fetch("/api/user/invoices", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Process the invoices to ensure items are properly parsed
      const processedInvoices = data.invoices.map((invoice: any) => {
        // Parse items if they're stored as a JSON string
        let parsedItems = invoice.items
        try {
          if (typeof invoice.items === "string") {
            parsedItems = JSON.parse(invoice.items)
          }
        } catch (e) {
          console.error(`Error parsing items for invoice ${invoice.id}:`, e)
          parsedItems = []
        }

        return {
          ...invoice,
          items: parsedItems,
          // Add a flag to identify template invoices
          isTemplateInvoice:
            typeof parsedItems === "object" &&
            (parsedItems.isTemplateInvoice ||
              (Array.isArray(parsedItems) &&
                parsedItems.some(
                  (item: any) =>
                    item.type === "template" || (item.tier && item.tier.toLowerCase().includes("template")),
                )) ||
              (typeof invoice.items === "string" &&
                (invoice.items.toLowerCase().includes("template") ||
                  invoice.items.toLowerCase().includes("istemplateinvoice")))),
        }
      })

      setInvoices(processedInvoices)
    } catch (error: any) {
      console.error("Error fetching invoices:", error)
      setInvoiceError(error.message || "Failed to load invoices")
      toast({
        title: "Error",
        description: `Failed to load invoices: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })

      // Set fallback data for development/demo purposes
      setInvoices([
        {
          id: "1",
          invoiceNumber: "INV-2023-001",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          amount: 349.0,
          status: "paid",
          items: [
            { id: "1", tier: "LLC Formation Package", price: 199.0 },
            { id: "2", tier: "EIN Filing", price: 99.0 },
            { id: "3", tier: "Operating Agreement", price: 51.0 },
          ],
          createdAt: "2023-01-15T12:00:00Z",
          updatedAt: "2023-01-15T12:30:00Z",
          paymentDate: "2023-01-15T12:30:00Z",
        },
        {
          id: "2",
          invoiceNumber: "INV-2023-045",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          amount: 99.0,
          status: "paid",
          items: [{ id: "4", tier: "Annual Report Filing", price: 99.0 }],
          createdAt: "2023-03-22T10:00:00Z",
          updatedAt: "2023-03-22T10:15:00Z",
          paymentDate: "2023-03-22T10:15:00Z",
        },
        {
          id: "3",
          invoiceNumber: "TEMP-2023-012",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          amount: 49.0,
          status: "paid",
          items: [{ id: "5", tier: "Operating Agreement Template", price: 49.0, type: "template" }],
          createdAt: "2023-05-10T14:00:00Z",
          updatedAt: "2023-05-10T14:20:00Z",
          paymentDate: "2023-05-10T14:20:00Z",
          isTemplateInvoice: true,
        },
      ])
    } finally {
      setLoadingInvoices(false)
    }
  }

  // Update the fetchFilings function to use the correct API endpoint
  const fetchFilings = async () => {
    try {
      setLoadingFilings(true)
      setFilingError(null)

      // Use the API endpoint that the annual-reports page likely uses
      const response = await fetch("/api/compliance/annual-reports", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch annual reports: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Filter for only filings with status "filed" or "completed"
      const filedReports = data.reports
        ? data.reports.filter((report: any) => report.status === "filed" || report.status === "completed")
        : []

      setFilings(filedReports)
    } catch (error: any) {
      console.error("Error fetching annual reports:", error)
      setFilingError(error.message || "Failed to load annual report filings")
      toast({
        title: "Error",
        description: `Failed to load annual report filings: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })

      // Set fallback data for development/demo purposes
      setFilings([
        {
          id: "1",
          deadlineId: "d1",
          deadlineTitle: "Annual Report 2023",
          receiptUrl: null,
          reportUrl: "/sample-report.pdf",
          status: "completed",
          userNotes: "Filed on time",
          adminNotes: "Processed and approved",
          filedDate: "2023-04-15T10:00:00Z",
          dueDate: "2023-05-01T00:00:00Z",
          createdAt: "2023-03-01T09:00:00Z",
        },
        {
          id: "2",
          deadlineId: "d2",
          deadlineTitle: "Biennial Report 2022",
          receiptUrl: "/sample-receipt.pdf",
          reportUrl: "/sample-report.pdf",
          status: "completed",
          userNotes: null,
          adminNotes: "Processed and approved",
          filedDate: "2022-04-10T11:30:00Z",
          dueDate: "2022-05-01T00:00:00Z",
          createdAt: "2022-03-15T14:00:00Z",
        },
      ])
    } finally {
      setLoadingFilings(false)
    }
  }

  // Update the fetchAmendments function to use the correct API endpoint
  const fetchAmendments = async () => {
    try {
      setLoadingAmendments(true)
      setAmendmentError(null)

      // Use the API endpoint that the amendments page likely uses
      const response = await fetch("/api/compliance/amendments", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch amendments: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Filter for only approved amendments
      const approvedAmendments = data.amendments
        ? data.amendments.filter(
            (amendment: any) => amendment.status === "approved" || amendment.status === "amendment_resolved",
          )
        : []

      setAmendments(approvedAmendments)
    } catch (error: any) {
      console.error("Error fetching amendments:", error)
      setAmendmentError(error.message || "Failed to load amendments")
      toast({
        title: "Error",
        description: `Failed to load amendments: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })

      // Set fallback data for development/demo purposes
      setAmendments([
        {
          id: "1",
          type: "Change of Registered Agent",
          details: "Updated registered agent to ABC Services",
          status: "approved",
          createdAt: "2023-06-10T09:00:00Z",
          updatedAt: "2023-06-15T14:30:00Z",
          documentUrl: "/sample-document.pdf",
          receiptUrl: "/sample-receipt.pdf",
          paymentAmount: 49.0,
        },
        {
          id: "2",
          type: "Name Change",
          details: "Changed business name from 'ABC LLC' to 'XYZ Enterprises LLC'",
          status: "amendment_resolved",
          createdAt: "2023-08-05T11:00:00Z",
          updatedAt: "2023-08-12T16:45:00Z",
          documentUrl: "/sample-document.pdf",
          receiptUrl: "/sample-receipt.pdf",
          paymentAmount: 79.0,
          notes: "Name change approved by state",
        },
      ])
    } finally {
      setLoadingAmendments(false)
    }
  }

  // Filter invoices based on search term and type
  const getFilteredInvoices = (type: "package" | "template") => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof invoice.items === "string" && invoice.items.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(invoice.items) &&
          invoice.items.some((item) => item.tier && item.tier.toLowerCase().includes(searchTerm.toLowerCase())))

      // Check if it's a template invoice
      const isTemplate =
        invoice.isTemplateInvoice ||
        invoice.invoiceNumber.toLowerCase().includes("temp") ||
        (typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template")) ||
        (Array.isArray(invoice.items) &&
          invoice.items.some((item) => item.tier && item.tier.toLowerCase().includes("template")))

      // For packages, we want invoices that start with 'inv' and are not templates
      if (type === "package") {
        return matchesSearch && invoice.invoiceNumber.toLowerCase().startsWith("inv") && !isTemplate
      }

      // For templates, we want invoices that are templates
      if (type === "template") {
        return matchesSearch && isTemplate
      }

      return false
    })
  }

  // Filter filings based on search term
  const getFilteredFilings = () => {
    return filings.filter((filing) => {
      const deadlineTitle = filing.deadlineTitle || (filing.deadline ? filing.deadline.title : "")
      return deadlineTitle.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }

  // Filter amendments based on search term
  const getFilteredAmendments = () => {
    return amendments.filter((amendment) => {
      return (
        amendment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amendment.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
      case "approved":
      case "amendment_resolved":
      case "filed":
        return "bg-green-100 text-green-800"
      case "pending":
      case "in_review":
      case "amendment_in_progress":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800"
      case "payment_received":
        return "bg-purple-100 text-purple-800"
      case "waiting_for_payment":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // View invoice details
  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  // View filing details
  const viewFilingDetails = (filing: Filing) => {
    setSelectedFiling(filing)
    setShowFilingDialog(true)
  }

  // View amendment details
  const viewAmendmentDetails = (amendment: Amendment) => {
    setSelectedAmendment(amendment)
    setShowAmendmentDialog(true)
  }

  // Get items from invoice
  const getInvoiceItems = (invoice: Invoice) => {
    if (Array.isArray(invoice.items)) {
      return invoice.items.map((item) => item.tier).join(", ")
    } else if (typeof invoice.items === "string") {
      try {
        const parsedItems = JSON.parse(invoice.items)
        if (Array.isArray(parsedItems)) {
          return parsedItems.map((item: any) => item.tier).join(", ")
        }
        return invoice.items
      } catch {
        return invoice.items
      }
    }
    return "Unknown items"
  }

  // Loading component
  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex justify-center items-center p-8">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )

  // Error component
  const ErrorState = ({ message, retry }: { message: string; retry: () => void }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-gray-700 mb-4">{message}</p>
      <Button onClick={retry}>Try Again</Button>
    </div>
  )

  // Empty state component
  const EmptyState = ({ message, icon }: { message: string; icon: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-gray-300">{icon}</div>
      <p className="text-gray-500">{message}</p>
    </div>
  )

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>

      <Card className="mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Your Orders</h2>
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              View Available Services
            </Button>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-2">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="annual-reports">Annual Reports</TabsTrigger>
              <TabsTrigger value="amendments">Amendments</TabsTrigger>
            </TabsList>
          </div>

          {/* Packages Tab */}
          <TabsContent value="packages" className="p-6 pt-4">
            {loadingInvoices ? (
              <LoadingState message="Loading package orders..." />
            ) : invoiceError ? (
              <ErrorState message={invoiceError} retry={fetchInvoices} />
            ) : (
              <>
                {getFilteredInvoices("package").length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredInvoices("package").map((invoice) => (
                      <Dialog key={invoice.id}>
                        <DialogTrigger asChild>
                          <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{formatDate(invoice.createdAt)}</span>
                                  <span>•</span>
                                  <span>${invoice.amount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                                {formatStatus(invoice.status)}
                              </span>
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-500">Order Number</p>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}
                                >
                                  {formatStatus(invoice.status)}
                                </span>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Order Items</h4>
                              <ul className="space-y-2">
                                {Array.isArray(invoice.items) ? (
                                  invoice.items.map((item, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>{item.tier}</span>
                                      <span className="ml-auto">${Number(item.price).toFixed(2)}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>{getInvoiceItems(invoice)}</span>
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Payment Information</h4>
                              <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-bold">${invoice.amount.toFixed(2)}</span>
                              </div>
                              {invoice.paymentDate && (
                                <div className="flex justify-between text-sm text-gray-500">
                                  <span>Payment Date</span>
                                  <span>{formatDate(invoice.paymentDate)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              {invoice.paymentReceipt && (
                                <Button variant="outline" asChild>
                                  <a href={invoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    View Receipt
                                  </a>
                                </Button>
                              )}
                              <Button>Contact Support</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No package orders found" icon={<ShoppingBag className="h-12 w-12" />} />
                )}
              </>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="p-6 pt-4">
            {loadingInvoices ? (
              <LoadingState message="Loading template orders..." />
            ) : invoiceError ? (
              <ErrorState message={invoiceError} retry={fetchInvoices} />
            ) : (
              <>
                {getFilteredInvoices("template").length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredInvoices("template").map((invoice) => (
                      <Dialog key={invoice.id}>
                        <DialogTrigger asChild>
                          <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{formatDate(invoice.createdAt)}</span>
                                  <span>•</span>
                                  <span>${invoice.amount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                                {formatStatus(invoice.status)}
                              </span>
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Template Order Details</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-500">Invoice Number</p>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}
                                >
                                  {formatStatus(invoice.status)}
                                </span>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Template Details</h4>
                              <ul className="space-y-2">
                                {Array.isArray(invoice.items) ? (
                                  invoice.items.map((item, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-purple-500" />
                                      <span>{item.tier}</span>
                                      <span className="ml-auto">${Number(item.price).toFixed(2)}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-500" />
                                    <span>{getInvoiceItems(invoice)}</span>
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Payment Information</h4>
                              <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-bold">${invoice.amount.toFixed(2)}</span>
                              </div>
                              {invoice.paymentDate && (
                                <div className="flex justify-between text-sm text-gray-500">
                                  <span>Payment Date</span>
                                  <span>{formatDate(invoice.paymentDate)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              {invoice.paymentReceipt && (
                                <Button variant="outline" asChild>
                                  <a href={invoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    View Receipt
                                  </a>
                                </Button>
                              )}
                              <Button>Contact Support</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No template orders found" icon={<FileText className="h-12 w-12" />} />
                )}
              </>
            )}
          </TabsContent>

          {/* Annual Reports Tab */}
          <TabsContent value="annual-reports" className="p-6 pt-4">
            {loadingFilings ? (
              <LoadingState message="Loading annual report filings..." />
            ) : filingError ? (
              <ErrorState message={filingError} retry={fetchFilings} />
            ) : (
              <>
                {getFilteredFilings().length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredFilings().map((filing) => (
                      <Dialog key={filing.id}>
                        <DialogTrigger asChild>
                          <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {filing.deadlineTitle || (filing.deadline ? filing.deadline.title : "Annual Report")}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>Filed: {formatDate(filing.filedDate)}</span>
                                  <span>•</span>
                                  <span>
                                    Due:{" "}
                                    {formatDate(filing.dueDate || (filing.deadline ? filing.deadline.dueDate : null))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(filing.status)}`}>
                                {formatStatus(filing.status)}
                              </span>
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Annual Report Filing Details</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Filing</p>
                                <p className="font-medium">
                                  {filing.deadlineTitle || (filing.deadline ? filing.deadline.title : "Annual Report")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(filing.status)}`}
                                >
                                  {formatStatus(filing.status)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Filed Date</p>
                                <p className="font-medium">
                                  {filing.filedDate ? formatDate(filing.filedDate) : "Not filed yet"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Due Date</p>
                                <p className="font-medium">
                                  {formatDate(filing.dueDate || (filing.deadline ? filing.deadline.dueDate : null))}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filing.receiptUrl && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Payment Receipt</h4>
                                  <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                                    <img
                                      src={filing.receiptUrl || "/placeholder.svg"}
                                      alt="Payment Receipt"
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={filing.receiptUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Receipt
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {filing.reportUrl && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Filed Report</h4>
                                  <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                                    <FileText className="h-16 w-16 text-gray-300" />
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={filing.reportUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Report
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {filing.userNotes && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Your Notes</h4>
                                <p className="text-sm p-3 bg-gray-50 rounded-md">{filing.userNotes}</p>
                              </div>
                            )}

                            {filing.adminNotes && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Admin Notes</h4>
                                <p className="text-sm p-3 bg-gray-50 rounded-md">{filing.adminNotes}</p>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <Button>Contact Support</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No annual report filings found" icon={<Calendar className="h-12 w-12" />} />
                )}
              </>
            )}
          </TabsContent>

          {/* Amendments Tab */}
          <TabsContent value="amendments" className="p-6 pt-4">
            {loadingAmendments ? (
              <LoadingState message="Loading amendments..." />
            ) : amendmentError ? (
              <ErrorState message={amendmentError} retry={fetchAmendments} />
            ) : (
              <>
                {getFilteredAmendments().length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredAmendments().map((amendment) => (
                      <Dialog key={amendment.id}>
                        <DialogTrigger asChild>
                          <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <PenTool className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-medium">{amendment.type}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>Submitted: {formatDate(amendment.createdAt)}</span>
                                  <span>•</span>
                                  <span>Updated: {formatDate(amendment.updatedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(amendment.status)}`}
                              >
                                {formatStatus(amendment.status)}
                              </span>
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Amendment Details</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-500">Amendment Type</p>
                                <p className="font-medium">{amendment.type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(amendment.status)}`}
                                >
                                  {formatStatus(amendment.status)}
                                </span>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Amendment Details</h4>
                              <p className="text-sm text-gray-700">{amendment.details}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                              <div>
                                <p className="text-sm text-gray-500">Submitted On</p>
                                <p className="font-medium">{formatDate(amendment.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Last Updated</p>
                                <p className="font-medium">{formatDate(amendment.updatedAt)}</p>
                              </div>
                            </div>

                            {amendment.paymentAmount && (
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Payment Information</h4>
                                <div className="flex justify-between">
                                  <span>Amount</span>
                                  <span className="font-bold">
                                    $
                                    {typeof amendment.paymentAmount === "number"
                                      ? amendment.paymentAmount.toFixed(2)
                                      : Number.parseFloat(amendment.paymentAmount).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {amendment.notes && (
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Notes</h4>
                                <p className="text-sm text-gray-700">{amendment.notes}</p>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              {amendment.documentUrl && (
                                <Button variant="outline" asChild>
                                  <a href={amendment.documentUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Document
                                  </a>
                                </Button>
                              )}
                              {amendment.receiptUrl && (
                                <Button variant="outline" asChild>
                                  <a href={amendment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Receipt
                                  </a>
                                </Button>
                              )}
                              <Button>Contact Support</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No amendments found" icon={<PenTool className="h-12 w-12" />} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Need Additional Services?</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg inline-block mb-3">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Annual Report Filing</h3>
              <p className="text-sm text-gray-600 mb-4">Let us handle your annual report filing requirements</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Registered Agent</h3>
              <p className="text-sm text-gray-600 mb-4">Professional registered agent service for your business</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Business Licenses</h3>
              <p className="text-sm text-gray-600 mb-4">Get the licenses and permits your business needs</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

