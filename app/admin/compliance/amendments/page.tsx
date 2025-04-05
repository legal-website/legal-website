"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { toast } from "@/components/ui/use-toast"

// Define Amendment type with expanded status options
interface Amendment {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  details: string
  status: string
  createdAt: string
  updatedAt: string
  documentUrl: string | null
  receiptUrl: string | null
  paymentAmount: number | null
  notes: string | null
}

// Expanded status enum
export enum AmendmentStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  WAITING_FOR_PAYMENT = "waiting_for_payment",
  PAYMENT_CONFIRMATION_PENDING = "payment_confirmation_pending",
  PAYMENT_RECEIVED = "payment_received",
  APPROVED = "approved",
  REJECTED = "rejected",
  AMENDMENT_IN_PROGRESS = "amendment_in_progress",
  AMENDMENT_RESOLVED = "amendment_resolved",
  CLOSED = "closed",
}

// Sort options
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"

export default function AdminAmendmentsPage() {
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingAmendmentId, setLoadingAmendmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [selectedAmendmentId, setSelectedAmendmentId] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusChangeNotes, setStatusChangeNotes] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // New filter and sort states
  const [clientFilter, setClientFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Auto refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Add a new state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [amendmentToDelete, setAmendmentToDelete] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null)

  // Add a new function to handle opening the delete dialog
  const handleOpenDeleteDialog = (amendmentId: string) => {
    setAmendmentToDelete(amendmentId)
    setIsDeleteDialogOpen(true)
  }

  // Add a new function to handle the deletion process
  const handleDeleteAmendmentOld = async () => {
    if (!amendmentToDelete) {
      console.error("No amendment selected for deletion.")
      return
    }

    try {
      setLoadingAmendmentId(amendmentToDelete)
      setSelectedAction("delete")

      const response = await fetch(`/api/admin/amendments/${amendmentToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Server error: ${response.status}`)
      }

      // Remove the deleted amendment from the state
      setAmendments((prev) => prev.filter((amendment) => amendment.id !== amendmentToDelete))

      toast({
        title: "Amendment deleted",
        description: "The amendment has been successfully deleted",
      })

      setIsDeleteDialogOpen(false)
      setAmendmentToDelete(null)
    } catch (err) {
      console.error("Error deleting amendment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unknown error occurred while deleting the amendment",
        variant: "destructive",
      })
    } finally {
      setLoadingAmendmentId(null)
      setSelectedAction(null)
    }
  }

  useEffect(() => {
    fetchAmendments()

    // Set up auto-refresh every 30 seconds
    refreshTimerRef.current = setInterval(() => {
      silentRefresh()
    }, 30000)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  // Silent refresh function that updates in the background
  const silentRefresh = async () => {
    try {
      console.log("Silent refresh: Fetching amendments...")
      setRefreshing(true)
      const response = await fetch("/api/admin/amendments")

      if (!response.ok) {
        console.error("Silent refresh: Error response", response.status)
        return
      }

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Silent refresh: Response is not valid JSON:", responseText)
        return
      }

      if (data && Array.isArray(data.amendments)) {
        setAmendments(data.amendments)
        console.log("Silent refresh: Amendments updated successfully")
      }
    } catch (err) {
      console.error("Silent refresh: Error fetching amendments:", err)
    } finally {
      setRefreshing(false)
    }
  }

  // Helper function to format currency amounts safely
  const formatCurrency = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00"

    // Convert to number if it's not already
    const numAmount = typeof amount === "number" ? amount : Number(amount)

    // Check if conversion resulted in a valid number
    if (isNaN(numAmount)) return "$0.00"

    // Now safely call toFixed
    return `$${numAmount.toFixed(2)}`
  }

  const testDatabaseConnection = async () => {
    try {
      console.log("Testing database connection...")

      // First try the basic connection test
      const connectionResponse = await fetch("/api/admin/test-db-connection")
      const connectionText = await connectionResponse.text()

      console.log(`Connection test response status: ${connectionResponse.status}`)
      console.log(`Connection test response text: ${connectionText}`)

      let connectionData
      try {
        connectionData = JSON.parse(connectionText)
        console.log("Connection test data:", connectionData)
      } catch (e) {
        console.error("Connection test response is not valid JSON")
      }

      if (!connectionResponse.ok) {
        toast({
          title: "Database Connection Error",
          description: connectionData?.error || "Failed to connect to database",
          variant: "destructive",
        })
        return
      }

      // If connection is successful, try the inspection endpoint
      const inspectResponse = await fetch("/api/admin/inspect-db")
      const inspectText = await inspectResponse.text()

      console.log(`Inspect DB response status: ${inspectResponse.status}`)
      console.log(`Inspect DB response text: ${inspectText}`)

      let inspectData
      try {
        inspectData = JSON.parse(inspectText)
        console.log("Inspect DB data:", inspectData)
      } catch (e) {
        console.error("Inspect DB response is not valid JSON")
      }

      if (inspectResponse.ok && inspectData?.success) {
        // Show a success message with some details about the DB
        const modelsList = inspectData.models.join(", ")
        toast({
          title: "Database Connection",
          description: `Connection successful. Available models: ${modelsList}`,
        })
      } else if (connectionResponse.ok) {
        // Connection works but inspection failed
        toast({
          title: "Database Connected",
          description: "Database connection is working, but there may be issues with the schema or models.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Database Error",
          description: inspectData?.error || "Unknown database error",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error testing database:", err)
      toast({
        title: "Connection Error",
        description: err instanceof Error ? err.message : "Unknown connection error",
        variant: "destructive",
      })
    }
  }

  const inspectDatabase = async () => {
    try {
      console.log("Inspecting database...")

      const response = await fetch("/api/admin/inspect-db")
      const responseText = await response.text()

      console.log(`Inspect DB response status: ${response.status}`)
      console.log(`Inspect DB response text: ${responseText}`)

      let data
      try {
        data = JSON.parse(responseText)
        console.log("Inspect DB data:", data)
      } catch (e) {
        console.error("Inspect DB response is not valid JSON")
      }

      if (response.ok && data?.success) {
        // Show a success message with some details about the DB
        toast({
          title: "Database Inspection",
          description: `Check console for detailed database information`,
        })
      } else {
        toast({
          title: "Inspection Error",
          description: data?.error || "Unknown error during database inspection",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error inspecting database:", err)
      toast({
        title: "Inspection Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const debugAmendment = async (amendmentId: string) => {
    try {
      console.log(`Debugging amendment ${amendmentId}`)

      // Fetch the amendment directly to check if it exists
      const response = await fetch(`/api/admin/amendments/${amendmentId}`)
      const responseText = await response.text()

      console.log(`Debug response status: ${response.status}`)
      console.log(`Debug response text: ${responseText}`)

      let data
      try {
        data = JSON.parse(responseText)
        console.log("Debug data:", data)
      } catch (e) {
        console.error("Debug response is not valid JSON")
      }

      toast({
        title: "Debug Info",
        description: `Check console for debug information about amendment ${amendmentId}`,
      })
    } catch (err) {
      console.error("Error debugging amendment:", err)
      toast({
        title: "Debug Error",
        description: err instanceof Error ? err.message : "Unknown debug error",
        variant: "destructive",
      })
    }
  }

  const fetchAmendmentsOld = async () => {
    try {
      console.log("Fetching amendments...")
      setLoading(true)
      const response = await fetch("/api/admin/amendments")
      console.log("Response received:", response.status)

      // Read the response body ONCE as text
      const responseText = await response.text()

      // Try to parse it as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Response is not valid JSON:", responseText)
        throw new Error("Invalid response format from server")
      }

      if (!response.ok) {
        console.error("Error response:", data)
        throw new Error(data.error || "Failed to fetch amendments")
      }

      console.log("Amendments data:", data)

      if (data && Array.isArray(data.amendments)) {
        setAmendments(data.amendments)
      } else {
        console.error("Invalid data format:", data)
        throw new Error("Invalid data format received from server")
      }
    } catch (err) {
      console.error("Error fetching amendments:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchAmendments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/amendments")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const data = await response.json()
      setAmendments(data)
    } catch (error) {
      console.error("Failed to fetch amendments:", error)
      toast({
        title: "Error",
        description: "Failed to load amendments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    setCurrentPage(1) // Reset to first page
    await fetchAmendments()
    toast({
      title: "Refreshed",
      description: "Amendments data has been refreshed",
    })
  }

  // Let's update the updateAmendmentStatus function with more detailed error handling
  const updateAmendmentStatus = async (
    amendmentId: string,
    newStatus: string,
    additionalData: Record<string, any> = {},
  ) => {
    try {
      console.log(`Updating amendment ${amendmentId} to status ${newStatus}`)
      setLoadingAmendmentId(amendmentId)

      const formData = new FormData()
      formData.append("status", newStatus)

      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      console.log("Form data:", Object.fromEntries(formData.entries()))

      // Try to make the fetch request
      let response
      try {
        response = await fetch(`/api/admin/amendments/${amendmentId}/status`, {
          method: "PATCH",
          body: formData,
        })
        console.log(`Response status: ${response.status}`)
      } catch (fetchError) {
        console.error("Network error during fetch:", fetchError)
        throw new Error(
          `Network error: ${fetchError instanceof Error ? fetchError.message : "Could not connect to server"}`,
        )
      }

      // Read the response body ONCE as text
      let responseText
      try {
        responseText = await response.text()
        console.log("Raw response text:", responseText)
      } catch (textError) {
        console.error("Error reading response text:", textError)
        throw new Error(
          `Error reading response: ${textError instanceof Error ? textError.message : "Could not read response"}`,
        )
      }

      // Try to parse it as JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
        console.log("Parsed response data:", responseData)
      } catch (parseError) {
        console.error("Response is not valid JSON:", responseText)
        // If it's not JSON, use the text as is
        responseData = { error: responseText || "Unknown error" }
      }

      if (!response.ok) {
        console.error("Error response:", responseData)
        throw new Error(responseData.error || `Server error: ${response.status}`)
      }

      // Update the amendments list
      setAmendments((prev) =>
        prev.map((amendment) => (amendment.id === amendmentId ? { ...amendment, ...responseData } : amendment)),
      )

      toast({
        title: "Status updated",
        description: `Amendment status updated to ${newStatus.replace(/_/g, " ")}`,
      })

      return true
    } catch (err) {
      console.error("Error updating amendment status:", err)

      // Show a more detailed error message
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while updating the status"

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoadingAmendmentId(null)
      setSelectedAction(null)
    }
  }

  const approveAmendment = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("approve")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.APPROVED)
    setSelectedAction(null)
  }

  const rejectAmendment = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("reject")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.REJECTED)
    setSelectedAction(null)
  }

  const handleRequestPayment = (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("payment")
    setPaymentAmount("")
    setAdminNotes("")
    setIsDialogOpen(true)
  }

  const handleSubmitPayment = async () => {
    if (!paymentAmount || isNaN(Number.parseFloat(paymentAmount)) || Number.parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount greater than zero",
        variant: "destructive",
      })
      return
    }

    if (!selectedAmendmentId) {
      console.error("No amendment selected for payment request.")
      return
    }

    let updateSuccess
    try {
      updateSuccess = await updateAmendmentStatus(selectedAmendmentId, AmendmentStatus.WAITING_FOR_PAYMENT, {
        paymentAmount: Number(paymentAmount),
        notes: adminNotes || undefined,
      })
    } catch (error) {
      console.error("Error updating amendment status:", error)
      toast({
        title: "Error",
        description: "Failed to update amendment status. Please check the console for details.",
        variant: "destructive",
      })
      return
    }

    if (updateSuccess) {
      setIsDialogOpen(false)
      setPaymentAmount("")
      setAdminNotes("")
      setSelectedAmendmentId(null)
      setSelectedAction(null)
    }
  }

  // New function to handle opening the status change dialog
  const handleOpenStatusChangeDialog = (amendmentId: string, currentStatus: string) => {
    setSelectedAmendmentId(amendmentId)
    setNewStatus(currentStatus)
    setStatusChangeNotes("")
    setIsStatusChangeDialogOpen(true)
  }

  // New function to handle status change submission
  const handleSubmitStatusChange = async () => {
    if (!selectedAmendmentId || !newStatus) {
      console.error("Missing amendment ID or status")
      return
    }

    const additionalData: Record<string, any> = {}
    if (statusChangeNotes) {
      additionalData.notes = statusChangeNotes
    }

    const success = await updateAmendmentStatus(selectedAmendmentId, newStatus, additionalData)

    if (success) {
      setIsStatusChangeDialogOpen(false)
      setSelectedAmendmentId(null)
      setNewStatus("")
      setStatusChangeNotes("")
    }
  }

  // New function to verify payment receipt
  const verifyPaymentReceipt = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("verify_payment")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.PAYMENT_RECEIVED)
    setSelectedAction(null)
  }

  // New function to reject payment receipt
  const rejectPaymentReceipt = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("reject_payment")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.WAITING_FOR_PAYMENT, {
      notes: "Invalid receipt. Please upload a valid payment receipt.",
    })
    setSelectedAction(null)
  }

  // New function to start amendment process
  const startAmendmentProcess = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("start_amendment")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.AMENDMENT_IN_PROGRESS)
    setSelectedAction(null)
  }

  // New function to mark amendment as resolved
  const resolveAmendment = async (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedAction("resolve_amendment")
    await updateAmendmentStatus(amendmentId, AmendmentStatus.AMENDMENT_RESOLVED)
    setSelectedAction(null)
  }

  // Filter amendments by client name/email
  const filterAmendmentsByClient = (amendments: Amendment[]) => {
    if (!clientFilter) return amendments

    const lowerCaseFilter = clientFilter.toLowerCase()
    return amendments.filter(
      (amendment) =>
        amendment.userName.toLowerCase().includes(lowerCaseFilter) ||
        amendment.userEmail.toLowerCase().includes(lowerCaseFilter),
    )
  }

  // Sort amendments
  const sortAmendments = (amendments: Amendment[]) => {
    switch (sortBy) {
      case "newest":
        return [...amendments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "oldest":
        return [...amendments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case "name-asc":
        return [...amendments].sort((a, b) => a.userName.localeCompare(b.userName))
      case "name-desc":
        return [...amendments].sort((a, b) => b.userName.localeCompare(a.userName))
      default:
        return amendments
    }
  }

  // First filter by tab
  let filteredAmendments =
    activeTab === "all" ? amendments : amendments.filter((amendment) => amendment.status === activeTab)

  // Then filter by client
  filteredAmendments = filterAmendmentsByClient(filteredAmendments)

  // Then sort
  filteredAmendments = sortAmendments(filteredAmendments)

  // Pagination logic
  const totalPages = Math.ceil(filteredAmendments.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAmendments.slice(indexOfFirstItem, indexOfLastItem)

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleViewDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/amendments/${id}`)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const data = await response.json()
      setSelectedAmendment(data)
      setIsDetailsOpen(true)
    } catch (error) {
      console.error("Failed to fetch amendment details:", error)
      toast({
        title: "Error",
        description: "Failed to load amendment details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAmendment = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/amendments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Server error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      // Remove the deleted amendment from the state
      setAmendments(amendments.filter((amendment) => amendment.id !== id))

      toast({
        title: "Success",
        description: "Amendment has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting amendment:", error)
      toast({
        title: "Error",
        description: `Failed to delete amendment: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "outline"
      case "approved":
        return "success"
      case "rejected":
        return "destructive"
      case "in_progress":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Amendments</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-[5%] mb-20 sm:mb-40">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Compliance Amendments</h1>
        <div className="flex space-x-2">
          {/*<Button variant="outline" onClick={testDatabaseConnection} size="sm">
            Test DB Connection
          </Button>
          <Button variant="outline" onClick={inspectDatabase} size="sm">
            Inspect DB
          </Button>*/}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAmendments} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/*{loading ? (
        <div className="text-center py-10">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-lg">Loading amendments...</p>
          </div>
        </div>
      ) : (*/}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="space-y-4 mb-4">
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/*<div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Filter by client name/email"
                    value={clientFilter}
                    onChange={(e) => {
                      setClientFilter(e.target.value)
                      setCurrentPage(1) // Reset to first page when filter changes
                    }}
                    className="pl-8"
                  />
                </div>

                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Select
                    value={sortBy}
                    onValueChange={(value: SortOption) => {
                      setSortBy(value)
                      setCurrentPage(1) // Reset to first page when sort changes
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center">
                        {sortBy.includes("desc") ? (
                          <SortDesc className="mr-2 h-4 w-4" />
                        ) : (
                          <SortAsc className="mr-2 h-4 w-4" />
                        )}
                        <span>Sort by</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="relative"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>}
                  </Button>
                </div>*/}
            </div>
          </div>

          {/* Tabs row */}
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="flex flex-nowrap min-w-max">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              {/*<TabsTrigger value={AmendmentStatus.PENDING}>Pending</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.IN_REVIEW}>In Review</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.WAITING_FOR_PAYMENT}>Payment Required</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.PAYMENT_CONFIRMATION_PENDING}>Payment Confirmation</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.PAYMENT_RECEIVED}>Payment Received</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.AMENDMENT_IN_PROGRESS}>In Progress</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.AMENDMENT_RESOLVED}>Resolved</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.APPROVED}>Approved</TabsTrigger>
                <TabsTrigger value={AmendmentStatus.REJECTED}>Rejected</TabsTrigger>*/}
            </TabsList>
          </div>
        </div>

        <TabsContent value={activeTab}>
          {filteredAmendments.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-500">No amendments found</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {filteredAmendments.map((amendment) => (
                  <Card key={amendment.id}>
                    <CardHeader>
                      <CardTitle>{amendment.type}</CardTitle>
                      <CardDescription>
                        <div className="flex justify-between items-center">
                          <span>Submitted by {amendment.userName}</span>
                          <Badge variant={getStatusBadgeVariant(amendment.status)}>
                            {amendment.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">
                        <strong>Date:</strong> {formatDate(amendment.createdAt)}
                      </p>
                      <p className="text-sm mb-2">
                        <strong>Email:</strong> {amendment.userEmail}
                      </p>
                      <p className="text-sm truncate">
                        <strong>Details:</strong> {amendment.details || "No details provided"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => handleViewDetails(amendment.id)}>
                        View Details
                      </Button>
                      <Button variant="destructive" onClick={() => confirmDelete(amendment.id)}>
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination controls */}
              {/*totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500 text-center sm:text-left">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAmendments.length)} of{" "}
                      {filteredAmendments.length} amendments
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )*/}
            </>
          )}
        </TabsContent>
      </Tabs>
      {/*)}*/}

      {/* Payment Request Dialog */}
      {/*<Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!loadingAmendmentId) setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>Enter the payment amount required for this amendment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Optional notes for the client"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={loadingAmendmentId === selectedAmendmentId}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPayment} disabled={loadingAmendmentId === selectedAmendmentId}>
              {loadingAmendmentId === selectedAmendmentId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>*/}

      {/* Status Change Dialog */}
      {/*<Dialog
        open={isStatusChangeDialogOpen}
        onOpenChange={(open) => {
          if (!loadingAmendmentId) setIsStatusChangeDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Amendment Status</DialogTitle>
            <DialogDescription>Select a new status for this amendment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AmendmentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={AmendmentStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={AmendmentStatus.WAITING_FOR_PAYMENT}>Waiting for Payment</SelectItem>
                  <SelectItem value={AmendmentStatus.PAYMENT_CONFIRMATION_PENDING}>
                    Payment Confirmation Pending
                  </SelectItem>
                  <SelectItem value={AmendmentStatus.PAYMENT_RECEIVED}>Payment Received</SelectItem>
                  <SelectItem value={AmendmentStatus.AMENDMENT_IN_PROGRESS}>Amendment In Progress</SelectItem>
                  <SelectItem value={AmendmentStatus.AMENDMENT_RESOLVED}>Amendment Resolved</SelectItem>
                  <SelectItem value={AmendmentStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={AmendmentStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={AmendmentStatus.CLOSED}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statusNotes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="statusNotes"
                placeholder="Optional notes about this status change"
                value={statusChangeNotes}
                onChange={(e) => setStatusChangeNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusChangeDialogOpen(false)}
              disabled={loadingAmendmentId === selectedAmendmentId}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitStatusChange} disabled={loadingAmendmentId === selectedAmendmentId}>
              {loadingAmendmentId === selectedAmendmentId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>*/}

      {/* Delete Confirmation Dialog */}
      {/*<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Amendment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this amendment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loadingAmendmentId === amendmentToDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAmendment}
              disabled={loadingAmendmentId === amendmentToDelete}
            >
              {loadingAmendmentId === amendmentToDelete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>*/}

      {/* Amendment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Amendment Details</DialogTitle>
          </DialogHeader>
          {selectedAmendment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Type</h3>
                  <p>{selectedAmendment.type}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <Badge variant={getStatusBadgeVariant(selectedAmendment.status)}>
                    {selectedAmendment.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold">Submitted By</h3>
                  <p>{selectedAmendment.userName}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p>{selectedAmendment.userEmail}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Submitted On</h3>
                  <p>{formatDate(selectedAmendment.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Last Updated</h3>
                  <p>{formatDate(selectedAmendment.updatedAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Details</h3>
                <p className="whitespace-pre-wrap">{selectedAmendment.details || "No details provided"}</p>
              </div>

              {selectedAmendment.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedAmendment.notes}</p>
                </div>
              )}

              {selectedAmendment.documentUrl && (
                <div>
                  <h3 className="font-semibold">Document</h3>
                  <a
                    href={selectedAmendment.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Document
                  </a>
                </div>
              )}

              {selectedAmendment.receiptUrl && (
                <div>
                  <h3 className="font-semibold">Receipt</h3>
                  <a
                    href={selectedAmendment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}

              {selectedAmendment.paymentAmount && (
                <div>
                  <h3 className="font-semibold">Payment Amount</h3>
                  <p>${selectedAmendment.paymentAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the amendment and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (deletingId) {
                  handleDeleteAmendment(deletingId)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"
  let label = status.replace(/_/g, " ")

  // Capitalize first letter of each word
  label = label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  switch (status) {
    case AmendmentStatus.APPROVED:
      variant = "default" // green
      break
    case AmendmentStatus.REJECTED:
      variant = "destructive" // red
      break
    case AmendmentStatus.PENDING:
      variant = "outline"
      break
    case AmendmentStatus.IN_REVIEW:
      variant = "secondary" // gray
      break
    case AmendmentStatus.WAITING_FOR_PAYMENT:
      variant = "secondary" // gray
      break
    case AmendmentStatus.PAYMENT_CONFIRMATION_PENDING:
      variant = "outline" // outline
      break
    case AmendmentStatus.PAYMENT_RECEIVED:
      variant = "default" // green
      break
    case AmendmentStatus.AMENDMENT_IN_PROGRESS:
      variant = "secondary" // gray
      break
    case AmendmentStatus.AMENDMENT_RESOLVED:
      variant = "default" // green
      break
    case AmendmentStatus.CLOSED:
      variant = "secondary" // gray
      break
    default:
      variant = getStatusBadgeVariant(status)
      break
  }

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}

