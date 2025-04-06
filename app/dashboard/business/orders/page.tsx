"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, FileText, ShoppingBag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useNotifications } from "@/components/admin/header"
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react"

// First, let's define a proper interface for the invoice item
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

// Then define the full invoice interface
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
  userId?: string
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
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { addNotification } = useNotifications()
  const [
    /*templateIdInput, setTemplateIdInput*/
  ] = useState<string>("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  // Add new state variables to track whether to show all items
  const [packagesDisplayCount, setPackagesDisplayCount] = useState(4)
  const [templatesDisplayCount, setTemplatesDisplayCount] = useState(4)

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/business/orders")
      return
    }
  }, [status, router])

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

        // Check if this is a template invoice
        const isTemplateInvoice =
          invoice.invoiceNumber?.toLowerCase().includes("temp") ||
          (typeof parsedItems === "object" &&
            (parsedItems.isTemplateInvoice ||
              (Array.isArray(parsedItems) &&
                parsedItems.some(
                  (item: any) =>
                    item.type === "template" || (item.tier && item.tier.toLowerCase().includes("template")),
                )) ||
              (typeof invoice.items === "string" &&
                (invoice.items.toLowerCase().includes("template") ||
                  invoice.items.toLowerCase().includes("istemplateinvoice")))))

        return {
          ...invoice,
          items: parsedItems,
          isTemplateInvoice: isTemplateInvoice,
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

      // For packages, we want invoices that are not templates
      if (type === "package") {
        return matchesSearch && !isTemplate
      }

      // For templates, we want invoices that are templates
      if (type === "template") {
        return matchesSearch && isTemplate
      }

      return false
    })
  }

  // Add pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentInvoices = getFilteredInvoices(activeTab === "packages" ? "package" : "template").slice(
    indexOfFirstItem,
    indexOfLastItem,
  )
  const totalPages = Math.ceil(
    getFilteredInvoices(activeTab === "packages" ? "package" : "template").length / itemsPerPage,
  )

  // Pagination navigation functions
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
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
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
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
    <div className="flex justify-center items-center p-4 sm:p-8">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-3 sm:mb-4"></div>
        <p className="text-base sm:text-lg font-medium text-muted-foreground text-center">{message}</p>
      </div>
    </div>
  )

  // Error component
  const ErrorState = ({ message, retry }: { message: string; retry: () => void }) => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
      <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">{message}</p>
      <Button onClick={retry} size="sm" className="sm:size-default">
        Try Again
      </Button>
    </div>
  )

  // Empty state component
  const EmptyState = ({ message, icon }: { message: string; icon: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
      <div className="mb-3 sm:mb-4 text-gray-300">{icon}</div>
      <p className="text-gray-500 text-sm sm:text-base">{message}</p>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 overflow-x-hidden">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Currency indicator at the top of the page */}
      {/*
      {currencyInfo && (
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-[7px] bg-[#21C582] text-white">
            <Image
              src={currencyInfo.flag || "/placeholder.svg"}
              alt={`${currencyInfo.code} flag`}
              width={20}
              height={15}
              className="mr-2"
            />
            <span>Paying in {currencyInfo.code}</span>
          </div>
        </div>
      )}
      */}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">Order History</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-6">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="packages" className="text-xs sm:text-sm">
              Packages
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Packages Tab */}
        <TabsContent value="packages" className="p-4 sm:p-6 pt-3 sm:pt-4">
          {loadingInvoices ? (
            <LoadingState message="Loading package orders..." />
          ) : invoiceError ? (
            <ErrorState message={invoiceError} retry={fetchInvoices} />
          ) : (
            <>
              {getFilteredInvoices("package").length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {currentInvoices.map((invoice) => (
                    <Dialog key={invoice.id}>
                      <DialogTrigger asChild>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 gap-2 sm:gap-0">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                                <span className="truncate">{formatDate(invoice.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(invoice.status)}`}
                            >
                              {formatStatus(invoice.status)}
                            </span>
                            <svg
                              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md md:max-w-lg w-[calc(100%-2rem)] p-4 sm:p-6 overflow-hidden">
                        <DialogHeader className="mb-2 sm:mb-4">
                          <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Order Number</p>
                              <p className="font-medium text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Date</p>
                              <p className="font-medium text-sm sm:text-base">{formatDate(invoice.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Status</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                                {formatStatus(invoice.status)}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-3 sm:pt-4">
                            <h4 className="font-medium text-sm sm:text-base mb-2">Order Items</h4>
                            <ul className="space-y-2">
                              {Array.isArray(invoice.items) ? (
                                invoice.items.map((item, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                    <span className="flex-1 truncate">{item.tier}</span>
                                    <span className="font-medium">${Number(item.price).toFixed(2)}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                  <span className="truncate">{getInvoiceItems(invoice)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                  {getFilteredInvoices("package").length > packagesDisplayCount && (
                    <Button
                      variant="outline"
                      className="w-full mt-3 sm:mt-4"
                      size="sm"
                      onClick={() => setPackagesDisplayCount((prev) => prev + 4)}
                    >
                      Show More
                    </Button>
                  )}
                  {packagesDisplayCount > 4 && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => setPackagesDisplayCount(4)}
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  message="No package orders found"
                  icon={<ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12" />}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="p-4 sm:p-6 pt-3 sm:pt-4">
          {loadingInvoices ? (
            <LoadingState message="Loading template orders..." />
          ) : invoiceError ? (
            <ErrorState message={invoiceError} retry={fetchInvoices} />
          ) : (
            <>
              {getFilteredInvoices("template").length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {currentInvoices.map((invoice) => (
                    <Dialog key={invoice.id}>
                      <DialogTrigger asChild>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 gap-2 sm:gap-0">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                                <span className="truncate">{formatDate(invoice.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(invoice.status)}`}
                            >
                              {formatStatus(invoice.status)}
                            </span>
                            <svg
                              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md md:max-w-lg w-[calc(100%-2rem)] p-4 sm:p-6 overflow-hidden">
                        <DialogHeader className="mb-2 sm:mb-4">
                          <DialogTitle>Template Order Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Order Number</p>
                              <p className="font-medium text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Date</p>
                              <p className="font-medium text-sm sm:text-base">{formatDate(invoice.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">Status</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                                {formatStatus(invoice.status)}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-3 sm:pt-4">
                            <h4 className="font-medium text-sm sm:text-base mb-2">Order Items</h4>
                            <ul className="space-y-2">
                              {Array.isArray(invoice.items) ? (
                                invoice.items.map((item, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                    <span className="flex-1 truncate">{item.tier}</span>
                                    <span className="font-medium">${Number(item.price).toFixed(2)}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                  <span className="truncate">{getInvoiceItems(invoice)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                  {getFilteredInvoices("template").length > templatesDisplayCount && (
                    <Button
                      variant="outline"
                      className="w-full mt-3 sm:mt-4"
                      size="sm"
                      onClick={() => setTemplatesDisplayCount((prev) => prev + 4)}
                    >
                      Show More
                    </Button>
                  )}
                  {templatesDisplayCount > 4 && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => setTemplatesDisplayCount(4)}
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  message="No template orders found"
                  icon={<FileText className="h-10 w-10 sm:h-12 sm:w-12" />}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for the "Not editable" icon
function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

// Helper component for the "Not editable" icon
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

