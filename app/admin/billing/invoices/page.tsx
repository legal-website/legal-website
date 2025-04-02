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
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
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
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useNotifications } from "@/components/admin/header"
import { invoiceEvents } from "@/lib/invoice-notifications"
import { getLastSeenInvoices, updateLastSeenInvoices } from "@/lib/invoice-tracker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerZip?: string
  customerCountry?: string
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

export default function InvoicesAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/billing/invoices")
      return
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchInvoices()
    }
  }, [status, session, router])

  // Reset to first page when changing tabs or search query
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching invoices...")
      const response = await fetch("/api/admin/invoices", {
        headers: {
          "Content-Type": "application/json",
        },
        // Include credentials to send cookies with the request
        credentials: "include",
      })

      console.log("Response status:", response.status)

      if (response.status === 401) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to view invoices.",
          variant: "destructive",
        })
        router.push("/login?callbackUrl=/admin/billing/invoices")
        return
      }

      if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view invoices.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)

        let errorData = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.error("Error parsing error response:", e)
        }

        console.error("Error response:", errorData)
        throw new Error((errorData as any).error || `Failed to fetch invoices: ${response.status}`)
      }

      const data = await response.json()
      console.log(`Received ${data.invoices?.length || 0} invoices`)

      if (!data.invoices) {
        console.error("No invoices array in response:", data)
        throw new Error("Invalid response format")
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

      // Check for new invoices
      const lastSeenInvoices = getLastSeenInvoices()
      const currentInvoiceIds = processedInvoices.map((invoice: Invoice) => invoice.id)

      // Find new invoices (those not in lastSeenInvoices)
      const newInvoices = processedInvoices.filter((invoice: Invoice) => !lastSeenInvoices.includes(invoice.id))

      // Notify about new invoices
      if (newInvoices.length > 0 && lastSeenInvoices.length > 0) {
        // Only notify if we've loaded invoices before (to avoid notifications on first load)
        newInvoices.forEach((invoice: Invoice) => {
          addNotification(invoiceEvents.invoiceCreated(invoice.invoiceNumber, invoice.customerName))
        })
      }

      // Update the last seen invoices
      updateLastSeenInvoices(currentInvoiceIds)

      setInvoices(processedInvoices)
      console.log("Invoices data structure:", JSON.stringify(processedInvoices.slice(0, 2), null, 2))
    } catch (error: any) {
      console.error("Error in fetchInvoices:", error)
      setError(error.message || "Failed to load invoices")
      toast({
        title: "Error",
        description: `Failed to load invoices: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
      // Initialize with empty array to prevent further errors
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // Function to determine if an invoice is a template invoice
  const isTemplateInvoice = (invoice: Invoice) => {
    if (invoice.isTemplateInvoice) return true

    // Check items if they're an array
    if (Array.isArray(invoice.items)) {
      return invoice.items.some(
        (item) =>
          item.type === "template" ||
          (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
      )
    }

    // Check if items is a string that contains template indicators
    if (typeof invoice.items === "string") {
      const lowerItems = invoice.items.toLowerCase()
      return lowerItems.includes("template") || lowerItems.includes("istemplateinvoice")
    }

    return false
  }

  // Add this helper function to extract template name from invoice items
  const getTemplateName = (invoice: any) => {
    try {
      // If items is a string, try to parse it
      if (typeof invoice.items === "string") {
        const parsedItems = JSON.parse(invoice.items)

        // Check for direct templateName property
        if (parsedItems.templateName) {
          return parsedItems.templateName
        }

        // Check for array with tier property
        if (Array.isArray(parsedItems) && parsedItems.length > 0 && parsedItems[0].tier) {
          return parsedItems[0].tier
        }

        // Check for object with numeric keys (our new format)
        if (parsedItems["0"] && parsedItems["0"].tier) {
          return parsedItems["0"].tier
        }
      }
      // If items is already an object/array
      else if (typeof invoice.items === "object") {
        // Direct templateName property
        if (invoice.items.templateName) {
          return invoice.items.templateName
        }

        // Array with tier property
        if (Array.isArray(invoice.items) && invoice.items.length > 0 && invoice.items[0].tier) {
          return invoice.items[0].tier
        }

        // Object with numeric keys
        if (invoice.items["0"] && invoice.items["0"].tier) {
          return invoice.items["0"].tier
        }
      }

      // Default fallback
      return "Unknown Template"
    } catch (e) {
      console.error("Error extracting template name:", e)
      return "Unknown Template"
    }
  }

  const filteredInvoices = invoices
    .filter((invoice) => {
      // Ensure invoice has all required properties
      if (
        !invoice ||
        !invoice.invoiceNumber ||
        !invoice.customerName ||
        !invoice.customerEmail ||
        invoice.amount === undefined ||
        !invoice.status ||
        !invoice.createdAt
      ) {
        console.warn("Filtering out invalid invoice:", invoice)
        return false
      }

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
        (activeTab === "cancelled" && invoice.status === "cancelled") ||
        (activeTab === "template" && isTemplateInvoice(invoice)) ||
        (activeTab === "regular" && !isTemplateInvoice(invoice))

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      // Scroll to top of the table
      document.querySelector(".invoices-table")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      // Scroll to top of the table
      document.querySelector(".invoices-table")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
  }

  const selectAllInvoices = () => {
    if (selectedInvoices.length === currentInvoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(currentInvoices.map((invoice) => invoice.id))
    }
  }

  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  const confirmDeleteInvoice = (invoice?: Invoice) => {
    if (invoice) {
      setInvoiceToDelete(invoice)
      setSelectedInvoices([invoice.id])
    }
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

      // Add notification
      addNotification(invoiceEvents.invoiceDeleted(invoiceToDelete.invoiceNumber))

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

  const deleteSelectedInvoices = async () => {
    try {
      setIsDeleting(true)

      // Create an array of promises for each delete operation
      const deletePromises = selectedInvoices.map((invoiceId) =>
        fetch(`/api/admin/invoices/${invoiceId}`, {
          method: "DELETE",
        }),
      )

      // Wait for all delete operations to complete
      const results = await Promise.allSettled(deletePromises)

      // Count successful and failed operations
      const successful = results.filter((result) => result.status === "fulfilled").length
      const failed = results.filter((result) => result.status === "rejected").length

      // Remove the deleted invoices from the local state
      setInvoices((prevInvoices) => prevInvoices.filter((inv) => !selectedInvoices.includes(inv.id)))

      // Add notification
      addNotification({
        title: "Invoices Deleted",
        description: `${successful} invoices deleted successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        source: "invoices",
      })

      toast({
        title: "Invoices deleted",
        description: `${successful} invoices have been deleted successfully${failed > 0 ? `, ${failed} failed` : ""}`,
      })

      // Close the dialog and clear selection
      setShowDeleteDialog(false)
      setSelectedInvoices([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Update the approvePayment function to handle template invoices
  const approvePayment = async (invoiceId: string) => {
    try {
      setIsProcessing(true)
      const invoice = invoices.find((inv) => inv.id === invoiceId)
      if (!invoice) return

      console.log(`Approving invoice ${invoiceId}...`)

      // Check if this is a template invoice
      const isTemplate = isTemplateInvoice(invoice)
      console.log(`Is template invoice: ${isTemplate}`)

      let response

      if (isTemplate) {
        // Use the template-specific route
        console.log("Using template invoice route")
        response = await fetch(`/api/template-invoice/update-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            status: "paid",
          }),
        })
      } else {
        // Try both API paths to ensure compatibility
        try {
          console.log("Using standard invoice route")
          response = await fetch(`/api/admin/invoices/${invoiceId}/approve`, {
            method: "POST",
          })

          if (!response.ok) {
            console.log(`First approval attempt failed, trying alternate path...`)
            response = await fetch(`/api/invoices/${invoiceId}/approve`, {
              method: "POST",
            })
          }
        } catch (error) {
          console.error("First approval attempt error:", error)
          // Try alternate path if first one fails
          response = await fetch(`/api/invoices/${invoiceId}/approve`, {
            method: "POST",
          })
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Approval error response:", errorData)
        throw new Error(errorData.error || "Failed to approve payment")
      }

      // Update the invoice in the local state
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "paid", paymentDate: new Date().toISOString() } : inv,
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

      // Add notification
      addNotification(invoiceEvents.paymentApproved(invoice.invoiceNumber, invoice.customerName))

      toast({
        title: "Payment approved",
        description: "The payment has been approved successfully.",
      })

      // Close the dialog if it's open
      setShowInvoiceDialog(false)

      // Refresh the invoices list
      fetchInvoices()
    } catch (error: any) {
      console.error("Error approving payment:", error)
      toast({
        title: "Error",
        description: `Failed to approve payment: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Update the rejectPayment function to handle template invoices
  const rejectPayment = async (invoiceId: string) => {
    try {
      setIsProcessing(true)
      const invoice = invoices.find((inv) => inv.id === invoiceId)
      if (!invoice) return

      console.log(`Rejecting invoice ${invoiceId}...`)

      // Check if this is a template invoice
      const isTemplate = isTemplateInvoice(invoice)
      console.log(`Is template invoice: ${isTemplate}`)

      let response

      if (isTemplate) {
        // Use the template-specific route
        console.log("Using template invoice route")
        response = await fetch(`/api/template-invoice/update-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            status: "cancelled",
          }),
        })
      } else {
        // Try both API paths to ensure compatibility
        try {
          console.log("Using standard invoice route")
          response = await fetch(`/api/admin/invoices/${invoiceId}/reject`, {
            method: "POST",
          })

          if (!response.ok) {
            console.log(`First rejection attempt failed, trying alternate path...`)
            response = await fetch(`/api/invoices/${invoiceId}/reject`, {
              method: "POST",
            })
          }
        } catch (error) {
          console.error("First rejection attempt error:", error)
          // Try alternate path if first one fails
          response = await fetch(`/api/invoices/${invoiceId}/reject`, {
            method: "POST",
          })
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Rejection error response:", errorData)
        throw new Error(errorData.error || "Failed to reject payment")
      }

      // Update the invoice in the local state
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: "cancelled" } : inv)),
      )

      // Update the selected invoice if it's open
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          status: "cancelled",
        })
      }

      // Add notification
      addNotification(invoiceEvents.paymentRejected(invoice.invoiceNumber, invoice.customerName))

      toast({
        title: "Payment rejected",
        description: "The payment has been rejected.",
      })

      // Close the dialog if it's open
      setShowInvoiceDialog(false)

      // Refresh the invoices list
      fetchInvoices()
    } catch (error: any) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "Error",
        description: `Failed to reject payment: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const sendEmail = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId)
      if (!invoice) return

      const response = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      // Add notification
      addNotification(invoiceEvents.emailSent(invoice.invoiceNumber, invoice.customerEmail))

      toast({
        title: "Email sent",
        description: `Invoice has been sent to ${invoice.customerEmail}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
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

    // Add notification
    addNotification({
      title: "Invoices Exported",
      description: `${filteredInvoices.length} invoices exported to CSV`,
      source: "invoices",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-white shadow-lg dark:bg-gray-800 max-w-md text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <FileText className="h-8 w-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Loading Invoices</h3>
            <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch your invoice data...</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h2 className="text-xl font-bold">Error Loading Invoices</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={fetchInvoices} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto mb-20 md:mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
            Manage and track all client invoices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center text-red-600 text-xs md:text-sm"
            onClick={() => {
              if (selectedInvoices.length > 0) {
                confirmDeleteInvoice()
              } else {
                toast({
                  title: "No invoices selected",
                  description: "Please select at least one invoice to delete.",
                })
              }
            }}
            disabled={selectedInvoices.length === 0}
          >
            <Trash2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Delete Selected</span>
            <span className="sm:hidden">Delete</span> ({selectedInvoices.length})
          </Button>
          <Button variant="outline" size="sm" className="flex items-center text-xs md:text-sm" onClick={exportInvoices}>
            <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-8">
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            className="pl-10 text-sm h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="text-xs md:text-sm">
          <Filter className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden xs:inline">Clear Filters</span>
          <span className="xs:hidden">Clear</span>
        </Button>

        <Button variant="outline" size="sm" onClick={fetchInvoices} className="text-xs md:text-sm">
          <Clock className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden xs:inline">Refresh</span>
        </Button>

        <div className="flex items-center gap-1 md:gap-2 ml-auto">
          <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">Items:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1) // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-[60px] md:w-[80px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">Sort:</span>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[110px] md:w-[180px] h-9 text-xs md:text-sm">
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
      <div className="mb-4 md:mb-8 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-md gap-1">
            <TabsTrigger value="all" className="px-2 md:px-4 text-xs md:text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="paid" className="px-2 md:px-4 text-xs md:text-sm">
              Paid
            </TabsTrigger>
            <TabsTrigger value="pending" className="px-2 md:px-4 text-xs md:text-sm">
              Pending
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="px-2 md:px-4 text-xs md:text-sm">
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="template" className="px-2 md:px-4 text-xs md:text-sm">
              Template
            </TabsTrigger>
            <TabsTrigger value="regular" className="px-2 md:px-4 text-xs md:text-sm">
              Regular
            </TabsTrigger>
          </TabsList>

          <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-500">
            {activeTab === "all" && "Showing all invoices"}
            {activeTab === "paid" && "Showing paid invoices only"}
            {activeTab === "pending" && "Showing pending invoices only"}
            {activeTab === "cancelled" && "Showing cancelled invoices only"}
            {activeTab === "template" && "Showing template invoices only"}
            {activeTab === "regular" && "Showing regular invoices only"}
            {filteredInvoices.length > 0 && ` (${filteredInvoices.length} found)`}
          </div>
        </Tabs>
      </div>

      {/* Invoices Table */}
      <Card className="invoices-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedInvoices.length > 0 && selectedInvoices.length === currentInvoices.length}
                    onChange={selectAllInvoices}
                  />
                </th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Invoice</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Customer</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Amount</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm hidden sm:table-cell">Date</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Status</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm hidden md:table-cell">Receipt</th>
                <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500 text-sm">
                    No invoices found
                  </td>
                </tr>
              ) : (
                currentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-2 md:p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </td>
                    <td className="p-2 md:p-4">
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                        <span className="text-xs md:text-sm">{invoice.invoiceNumber}</span>
                        {isTemplateInvoice(invoice) && (
                          <span className="ml-1 md:ml-2 px-1 py-0.5 text-[10px] md:text-xs bg-blue-100 text-blue-800 rounded-full">
                            Template
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 md:p-4">
                      <div>
                        <p className="font-medium text-xs md:text-sm truncate max-w-[120px] md:max-w-[200px]">
                          {invoice.customerName}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500 truncate max-w-[120px] md:max-w-[200px]">
                          {invoice.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 font-medium text-xs md:text-sm">${invoice.amount.toFixed(2)}</td>
                    <td className="p-2 md:p-4 text-gray-500 text-xs md:text-sm hidden sm:table-cell">
                      {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-2 md:p-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="p-2 md:p-4 hidden md:table-cell">
                      {invoice.paymentReceipt ? (
                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                          <a href={invoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                            View Receipt
                          </a>
                        </Button>
                      ) : (
                        <span className="text-gray-500 text-xs md:text-sm">No receipt</span>
                      )}
                    </td>
                    <td className="p-2 md:p-4">
                      {/* Desktop actions */}
                      <div className="hidden md:flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewInvoiceDetails(invoice)}
                          className="h-7 text-xs"
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          View
                        </Button>

                        {invoice.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 h-7 text-xs"
                              onClick={() => approvePayment(invoice.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                              Approve
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 h-7 text-xs"
                              onClick={() => rejectPayment(invoice.id)}
                              disabled={isProcessing}
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 h-7 text-xs"
                          onClick={() => confirmDeleteInvoice(invoice)}
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Delete
                        </Button>
                      </div>

                      {/* Mobile actions */}
                      <div className="md:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => viewInvoiceDetails(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            {invoice.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => approvePayment(invoice.id)}
                                  disabled={isProcessing}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => rejectPayment(invoice.id)}
                                  disabled={isProcessing}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            {invoice.paymentReceipt && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={invoice.paymentReceipt}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>View Receipt</span>
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => confirmDeleteInvoice(invoice)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 md:p-4 border-t gap-2">
            <div className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} invoices
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-1 md:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="flex items-center h-8 text-xs"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-0 md:mr-1" />
                <span className="hidden md:inline">Previous</span>
              </Button>
              <div className="text-xs md:text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="flex items-center h-8 text-xs"
              >
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0 md:ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog
          open={showInvoiceDialog}
          onOpenChange={(open) => {
            setShowInvoiceDialog(open)
          }}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center flex-wrap gap-2 text-base md:text-lg">
                Invoice {selectedInvoice.invoiceNumber}
                {isTemplateInvoice(selectedInvoice) && (
                  <span className="ml-0 md:ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Template
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="py-2 md:py-4">
              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row md:justify-between mb-4 md:mb-8">
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1">Invoice</h3>
                  <p className="text-gray-500 text-sm">{selectedInvoice.invoiceNumber}</p>
                  <div className="mt-2 md:mt-4">
                    <p className="font-medium text-sm">Billed To:</p>
                    <p className="text-sm">{selectedInvoice.customerName}</p>
                    <p className="text-xs md:text-sm text-gray-500 break-words">{selectedInvoice.customerEmail}</p>
                    {selectedInvoice.customerPhone && (
                      <p className="text-xs md:text-sm text-gray-500">{selectedInvoice.customerPhone}</p>
                    )}
                    {selectedInvoice.customerCompany && <p className="text-sm">{selectedInvoice.customerCompany}</p>}
                    {selectedInvoice.customerAddress && (
                      <p className="text-xs md:text-sm">
                        {selectedInvoice.customerAddress},
                        {selectedInvoice.customerCity && ` ${selectedInvoice.customerCity},`}
                        {selectedInvoice.customerState && ` ${selectedInvoice.customerState}`}
                        {selectedInvoice.customerZip && ` ${selectedInvoice.customerZip}`}
                      </p>
                    )}
                    {selectedInvoice.customerCountry && <p className="text-sm">{selectedInvoice.customerCountry}</p>}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="mb-2 md:mb-4">
                    <p className="text-xs md:text-sm text-gray-500">Status</p>
                    <InvoiceStatusBadge status={selectedInvoice.status} />
                  </div>
                  <div className="mb-2">
                    <p className="text-xs md:text-sm text-gray-500">Invoice Date</p>
                    <p className="text-sm">{format(new Date(selectedInvoice.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  {selectedInvoice.paymentDate && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Payment Date</p>
                      <p className="text-sm">{format(new Date(selectedInvoice.paymentDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Name Display (for template invoices) */}
              {selectedInvoice && isTemplateInvoice(selectedInvoice) && (
                <div className="mb-4">
                  <h3 className="font-semibold text-base md:text-lg mb-2">Template Information</h3>
                  <div className="p-3 md:p-4 border rounded-lg">
                    <p className="text-xs md:text-sm font-medium">
                      <span className="text-gray-600">Template Name:</span> {getTemplateName(selectedInvoice)}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-2">
                      Note: Template access is managed separately. Approving this invoice will not automatically unlock
                      the template.
                    </p>
                  </div>
                </div>
              )}

              {/* Invoice Items */}
              <div className="mb-4 md:mb-8 overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-xs md:text-sm">Item</th>
                      <th className="text-right p-2 font-medium text-xs md:text-sm">Price</th>
                      <th className="text-right p-2 font-medium text-xs md:text-sm">Quantity</th>
                      <th className="text-right p-2 font-medium text-xs md:text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedInvoice.items) ? (
                      selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="text-xs md:text-sm">{item.tier} Package</p>
                              {item.state && (
                                <p className="text-[10px] md:text-xs text-gray-500">{item.state} State Filing Fee</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <div>
                              <p className="text-xs md:text-sm">${item.price.toFixed(2)}</p>
                              {item.stateFee && (
                                <p className="text-[10px] md:text-xs text-gray-500">${item.stateFee.toFixed(2)}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right text-xs md:text-sm">1</td>
                          <td className="p-2 text-right text-xs md:text-sm">
                            ${(item.price + (item.stateFee || 0) - (item.discount || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-gray-500 text-xs md:text-sm">
                          No items found or invalid items format
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-medium text-xs md:text-sm">
                        Total
                      </td>
                      <td className="p-2 text-right font-bold text-xs md:text-sm">
                        ${selectedInvoice.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Receipt */}
              {selectedInvoice.paymentReceipt && (
                <div className="mb-4 md:mb-8">
                  <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-4">Payment Receipt</h3>
                  <div className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <p className="text-xs md:text-sm">Receipt uploaded by customer</p>
                      <Button variant="outline" size="sm" asChild className="text-xs w-full sm:w-auto">
                        <a href={selectedInvoice.paymentReceipt} target="_blank" rel="noopener noreferrer">
                          View Receipt
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Actions */}
              {selectedInvoice.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 mt-4">
                  <Button
                    onClick={() => approvePayment(selectedInvoice.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm w-full sm:w-auto"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Approve Payment
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 text-xs md:text-sm w-full sm:w-auto"
                    onClick={() => rejectPayment(selectedInvoice.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Reject Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInvoiceDialog(false)}
                className="text-xs md:text-sm w-full sm:w-auto"
              >
                Close
              </Button>
              <Button variant="outline" className="text-xs md:text-sm w-full sm:w-auto">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => sendEmail(selectedInvoice.id)}
                className="text-xs md:text-sm w-full sm:w-auto"
              >
                <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Email Customer
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 text-xs md:text-sm w-full sm:w-auto"
                onClick={() => confirmDeleteInvoice(selectedInvoice)}
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Delete Invoice
              </Button>
              <Button
                variant="outline"
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 text-xs md:text-sm w-full sm:w-auto"
                onClick={() => {
                  if (selectedInvoice) {
                    console.log("Invoice details:", selectedInvoice)

                    // Try to parse items if they're a string
                    if (typeof selectedInvoice.items === "string") {
                      try {
                        const parsedItems = JSON.parse(selectedInvoice.items)
                        console.log("Parsed items:", parsedItems)
                      } catch (e) {
                        console.error("Error parsing items:", e)
                      }
                    } else {
                      console.log("Items (already parsed):", selectedInvoice.items)
                    }

                    toast({
                      title: "Debug Info",
                      description: "Invoice details logged to console",
                    })
                  }
                }}
              >
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Debug Info
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs md:text-sm">
              {selectedInvoices.length === 1 && invoiceToDelete
                ? `This will permanently delete invoice ${invoiceToDelete.invoiceNumber}.`
                : `This will permanently delete ${selectedInvoices.length} invoices.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="text-xs md:text-sm mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (selectedInvoices.length === 1 && invoiceToDelete) {
                  deleteInvoice()
                } else {
                  deleteSelectedInvoices()
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm"
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
        <span className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
          Paid
        </span>
      )
    case "pending":
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
          Pending
        </span>
      )
    case "cancelled":
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
          Cancelled
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      )
  }
}

