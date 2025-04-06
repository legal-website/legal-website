"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, FileText, ShoppingBag, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { DialogFooter } from "@/components/ui/dialog"

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
  userId?: string
  isTemplateInvoice?: boolean
}

export default function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("packages")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [packageInvoices, setPackageInvoices] = useState<Invoice[]>([])
  const [templateInvoices, setTemplateInvoices] = useState<Invoice[]>([])

  // Loading states
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  // Error states
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const { toast } = useToast()
  const { status } = useSession()
  const router = useRouter()

  // Add state variables to track whether to show all items
  const [packagesDisplayCount, setPackagesDisplayCount] = useState(4)
  const [templatesDisplayCount, setTemplatesDisplayCount] = useState(4)

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/billing/invoices")
      return
    }
  }, [status, router])

  // Fetch invoices from the API
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true)
      setInvoiceError(null)

      // Use the /api/user/spending endpoint
      const response = await fetch("/api/user/spending", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`)
      }

      const data = await response.json()

      if (!data.spending || !data.spending.recentInvoices) {
        throw new Error("Invalid response format")
      }

      // Process the invoices to ensure items are properly parsed
      const processedInvoices = data.spending.recentInvoices.map((invoice: any) => {
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
                    item.type === "template" ||
                    (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
                )) ||
              invoice.items.toLowerCase().includes("template") ||
              invoice.items.toLowerCase().includes("istemplateinvoice")),
        }
      })

      console.log("All processed invoices:", processedInvoices)
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

  // Separate invoices into packages and templates after fetching
  useEffect(() => {
    if (invoices.length > 0) {
      const packages: Invoice[] = []
      const templates: Invoice[] = []

      invoices.forEach((invoice) => {
        // Check if it's explicitly a template
        let isTemplate = false

        if (invoice.invoiceNumber) {
          const invNumber = invoice.invoiceNumber.trim().toUpperCase()

          // Only mark as template if it explicitly contains TEMP or TEMPLATE
          if (invNumber.includes("TEMP") || invNumber.includes("TEMPLATE")) {
            isTemplate = true
          }
        }

        // Add to templates array if it's a template
        if (isTemplate) {
          templates.push(invoice)
        } else {
          packages.push(invoice)
        }
      })

      setPackageInvoices(packages)
      setTemplateInvoices(templates)
    }
  }, [invoices])

  // Filter invoices based on search term
  const getFilteredInvoices = (type: "package" | "template") => {
    const invoicesToFilter = type === "package" ? packageInvoices : templateInvoices

    return invoicesToFilter.filter((invoice) => {
      // If no search term, return all invoices of this type
      if (!searchTerm) return true

      // Check if invoice number, customer name, or items match search term
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof invoice.items === "string" && invoice.items.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(invoice.items) &&
          invoice.items.some((item) => item.tier && item.tier.toLowerCase().includes(searchTerm.toLowerCase())))
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
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
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
    // Ensure all necessary data is available
    if (typeof invoice.items === "string") {
      try {
        invoice.items = JSON.parse(invoice.items)
      } catch (e) {
        console.error(`Error parsing items for invoice ${invoice.id}:`, e)
      }
    }

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
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-3 sm:mb-4"></div>
        <p className="text-gray-500 text-sm sm:text-base text-center">{message}</p>
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

  // View full invoice page
  const viewFullInvoice = (invoiceId: string) => {
    window.open(`/invoice/${invoiceId}`, "_blank")
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 overflow-x-hidden">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Currency indicator at the top of the page - Removed as it's not needed */}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          <div className="bg-blue-50 p-4 rounded-md flex items-start mb-6">
            <AlertCircle className="text-blue-500 mr-2 mt-0.5" size={18} />
            <div>
              <p className="text-blue-800 font-medium">Manual Payment Process</p>
              <p className="text-blue-700 text-sm">
                Please make your payment using your preferred method and upload the receipt below. Our team will verify
                your payment within 1-2 business days.
              </p>
            </div>
          </div>

          {/* Removed the form as it's not needed */}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-6">Order History</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Packages Tab */}
            <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 sm:px-6 pt-2">
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="packages">Packages</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="packages" className="p-4 sm:p-6 pt-3 sm:pt-4">
                {loadingInvoices ? (
                  <LoadingState message="Loading package orders..." />
                ) : invoiceError ? (
                  <ErrorState message={invoiceError} retry={fetchInvoices} />
                ) : (
                  <>
                    {getFilteredInvoices("package").length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {getFilteredInvoices("package")
                          .slice(0, packagesDisplayCount)
                          .map((invoice) => (
                            <Dialog key={invoice.id}>
                              <DialogTrigger asChild>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 gap-2 sm:gap-0">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm sm:text-base truncate">
                                        {invoice.invoiceNumber}
                                      </p>
                                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                                        <span className="truncate">{formatDate(invoice.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(
                                        invoice.status,
                                      )}`}
                                    >
                                      {formatStatus(invoice.status)}
                                    </span>
                                    <svg
                                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
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
                                      <p className="font-medium text-sm sm:text-base truncate">
                                        {invoice.invoiceNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-500">Date</p>
                                      <p className="font-medium text-sm sm:text-base">
                                        {formatDate(invoice.createdAt)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-500">Status</p>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getStatusBadgeColor(
                                          invoice.status,
                                        )}`}
                                      >
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
                                            <span className="font-medium">${item.price.toFixed(2)}</span>
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

                                  <div className="border-t pt-3 sm:pt-4">
                                    <h4 className="font-medium text-sm sm:text-base mb-2">Payment Information</h4>
                                    <div className="flex justify-between text-sm">
                                      <span>Total</span>
                                      <span className="font-bold">${invoice.amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                                    Close
                                  </Button>
                                </DialogFooter>
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
                        {getFilteredInvoices("template")
                          .slice(0, templatesDisplayCount)
                          .map((invoice) => (
                            <Dialog key={invoice.id}>
                              <DialogTrigger asChild>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 gap-2 sm:gap-0">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm sm:text-base truncate">
                                        {invoice.invoiceNumber}
                                      </p>
                                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                                        <span className="truncate">{formatDate(invoice.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(
                                        invoice.status,
                                      )}`}
                                    >
                                      {formatStatus(invoice.status)}
                                    </span>
                                    <svg
                                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
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
                                      <p className="font-medium text-sm sm:text-base truncate">
                                        {invoice.invoiceNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-500">Date</p>
                                      <p className="font-medium text-sm sm:text-base">
                                        {formatDate(invoice.createdAt)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-500">Status</p>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getStatusBadgeColor(
                                          invoice.status,
                                        )}`}
                                      >
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
                                            <span className="font-medium">${item.price.toFixed(2)}</span>
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
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                                    Close
                                  </Button>
                                </DialogFooter>
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
        </div>
      </Card>
    </div>
  )
}

