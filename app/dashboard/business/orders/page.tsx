"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Download, FileText, Search, ShoppingBag, PenTool, Users } from "lucide-react"
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

// Mock data for annual reports
const mockFilings: Filing[] = [
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
]

// Mock data for amendments
const mockAmendments: Amendment[] = [
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
]

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
  const [filings, setFilings] = useState<Filing[]>(mockFilings)
  const [amendments, setAmendments] = useState<Amendment[]>(mockAmendments)

  // Loading states
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingFilings, setLoadingFilings] = useState(false) // Set to false since we're using mock data
  const [loadingAmendments, setLoadingAmendments] = useState(false) // Set to false since we're using mock data

  // Error states
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [filingError, setFilingError] = useState<string | null>(null)
  const [amendmentError, setAmendmentError] = useState<string | null>(null)

  const { toast } = useToast()

  // Add new state variables to track whether to show all items
  const [packagesDisplayCount, setPackagesDisplayCount] = useState(4)
  const [templatesDisplayCount, setTemplatesDisplayCount] = useState(4)

  useEffect(() => {
    fetchInvoices()
    // No need to fetch filings and amendments since we're using mock data
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchInvoices}>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
            </div>
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
            <div className="w-full sm:w-auto">
              <select
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  // Sort logic would go here
                  const sortValue = e.target.value
                  if (sortValue === "newest") {
                    setInvoices(
                      [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                    )
                  } else if (sortValue === "oldest") {
                    setInvoices(
                      [...invoices].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
                    )
                  } else if (sortValue === "highest") {
                    setInvoices([...invoices].sort((a, b) => b.amount - a.amount))
                  } else if (sortValue === "lowest") {
                    setInvoices([...invoices].sort((a, b) => a.amount - b.amount))
                  }
                }}
              >
                <option value="">Sort by</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-2">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
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
                    {getFilteredInvoices("package")
                      .slice(0, packagesDisplayCount)
                      .map((invoice) => (
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
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}
                                >
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
                    {getFilteredInvoices("package").length > packagesDisplayCount && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setPackagesDisplayCount((prev) => prev + 4)}
                      >
                        Show More
                      </Button>
                    )}
                    {packagesDisplayCount > 4 && (
                      <Button variant="outline" className="w-full mt-4" onClick={() => setPackagesDisplayCount(4)}>
                        Show Less
                      </Button>
                    )}
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
                    {getFilteredInvoices("template")
                      .slice(0, templatesDisplayCount)
                      .map((invoice) => (
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
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}
                                >
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
                    {getFilteredInvoices("template").length > templatesDisplayCount && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setTemplatesDisplayCount((prev) => prev + 4)}
                      >
                        Show More
                      </Button>
                    )}
                    {templatesDisplayCount > 4 && (
                      <Button variant="outline" className="w-full mt-4" onClick={() => setTemplatesDisplayCount(4)}>
                        Show Less
                      </Button>
                    )}
                  </div>
                ) : (
                  <EmptyState message="No template orders found" icon={<FileText className="h-12 w-12" />} />
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
              <Button size="sm" variant="outline" className="w-full" asChild>
                <a href="/dashboard/compliance/annual-reports">Learn More</a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
                <PenTool className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Submit an Amendment</h3>
              <p className="text-sm text-gray-600 mb-4">Update your business information or structure</p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <a href="/dashboard/compliance/amendments">Learn More</a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Add Beneficial Ownership</h3>
              <p className="text-sm text-gray-600 mb-4">Comply with beneficial ownership reporting requirements</p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <a href="/dashboard/compliance/beneficial-ownership">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

