"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast-utils"
import { Loader2, FileText, CheckCircle, AlertCircle, Clock, PenTool, DollarSign, ChevronLeft, ChevronRight, RefreshCw, Search, SortDesc, SortAsc, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  CLOSED = "closed"
}

// Sort options
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"

export default function AmendmentsPage() {
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
    const numAmount = typeof amount === 'number' ? amount : Number(amount)
    
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

  const fetchAmendments = async () => {
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
      notes: "Invalid receipt. Please upload a valid payment receipt."
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
      amendment => 
        amendment.userName.toLowerCase().includes(lowerCaseFilter) || 
        amendment.userEmail.toLowerCase().includes(lowerCaseFilter)
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
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="container mx-auto py-6 px-[5%] mb-40">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Compliance Amendments</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={testDatabaseConnection} size="sm">
            Test DB Connection
          </Button>
          <Button variant="outline" onClick={inspectDatabase} size="sm">
            Inspect DB
          </Button>
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

      {loading ? (
        <div className="text-center py-10">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-lg">Loading amendments...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.PENDING}>Pending</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.IN_REVIEW}>In Review</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.WAITING_FOR_PAYMENT}>Payment Required</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.PAYMENT_CONFIRMATION_PENDING}>Payment Confirmation</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.PAYMENT_RECEIVED}>Payment Received</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.AMENDMENT_IN_PROGRESS}>In Progress</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.AMENDMENT_RESOLVED}>Resolved</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.APPROVED}>Approved</TabsTrigger>
              <TabsTrigger value={AmendmentStatus.REJECTED}>Rejected</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
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
              
              <Select 
                value={sortBy} 
                onValueChange={(value: SortOption) => {
                  setSortBy(value)
                  setCurrentPage(1) // Reset to first page when sort changes
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    {sortBy.includes('desc') ? <SortDesc className="mr-2 h-4 w-4" /> : <SortAsc className="mr-2 h-4 w-4" />}
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
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab}>
            {filteredAmendments.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-lg text-gray-500">No amendments found</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {currentItems.map((amendment) => (
                    <Card key={amendment.id} className="overflow-hidden border-l-2 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{amendment.type}</CardTitle>
                          <StatusBadge status={amendment.status} />
                        </div>
                        <CardDescription>
                          Submitted by {amendment.userName} ({amendment.userEmail})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Details:</h4>
                          <p className="text-sm text-gray-600 mt-1">{amendment.details}</p>
                        </div>

                        {amendment.documentUrl && (
                          <div className="mb-3 p-2 bg-blue-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-blue-500" /> Document:
                            </h4>
                            <a
                              href={amendment.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                            >
                              View Document
                            </a>
                          </div>
                        )}

                        {amendment.paymentAmount !== null && (
                          <div className="mb-3 p-2 bg-yellow-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-yellow-500" /> Payment Amount:
                            </h4>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{formatCurrency(amendment.paymentAmount)}</p>
                          </div>
                        )}

                        {amendment.notes && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700">Notes:</h4>
                            <p className="text-sm text-gray-600 mt-1">{amendment.notes}</p>
                          </div>
                        )}

                        {/* Receipt verification section */}
                        {amendment.status === AmendmentStatus.PAYMENT_CONFIRMATION_PENDING && amendment.receiptUrl && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-blue-500" /> Receipt Verification:
                            </h4>
                            <a
                              href={amendment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline block mb-2 mt-1"
                            >
                              View Receipt
                            </a>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => verifyPaymentReceipt(amendment.id)}
                                disabled={loadingAmendmentId === amendment.id}
                              >
                                {loadingAmendmentId === amendment.id && selectedAction === "verify_payment" ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() => rejectPaymentReceipt(amendment.id)}
                                disabled={loadingAmendmentId === amendment.id}
                              >
                                {loadingAmendmentId === amendment.id && selectedAction === "reject_payment" ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Amendment process section */}
                        {amendment.status === AmendmentStatus.PAYMENT_RECEIVED && (
                          <div className="mb-3 mt-3">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => startAmendmentProcess(amendment.id)}
                              disabled={loadingAmendmentId === amendment.id}
                            >
                              {loadingAmendmentId === amendment.id && selectedAction === "start_amendment" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Start Amendment Process
                            </Button>
                          </div>
                        )}

                        {amendment.status === AmendmentStatus.AMENDMENT_IN_PROGRESS && (
                          <div className="mb-3 mt-3">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => resolveAmendment(amendment.id)}
                              disabled={loadingAmendmentId === amendment.id}
                            >
                              {loadingAmendmentId === amendment.id && selectedAction === "resolve_amendment" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Mark as Resolved
                            </Button>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 mt-2">
                          Submitted: {new Date(amendment.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2 pt-2 pb-4 bg-gray-50">
                        {/* Status change button for all amendments */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenStatusChangeDialog(amendment.id, amendment.status)}
                          className="ml-auto"
                        >
                          Change Status
                        </Button>

                        {/* Original action buttons for pending amendments */}
                        {amendment.status === AmendmentStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveAmendment(amendment.id)}
                              disabled={loadingAmendmentId === amendment.id}
                            >
                              {loadingAmendmentId === amendment.id &&
                              amendment.id === selectedAmendmentId &&
                              selectedAction === "approve" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectAmendment(amendment.id)}
                              disabled={loadingAmendmentId === amendment.id}
                            >
                              {loadingAmendmentId === amendment.id &&
                              amendment.id === selectedAmendmentId &&
                              selectedAction === "reject" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestPayment(amendment.id)}
                              disabled={loadingAmendmentId === amendment.id}
                            >
                              {loadingAmendmentId === amendment.id &&
                              amendment.id === selectedAmendmentId &&
                              selectedAction === "payment" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Request Payment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => debugAmendment(amendment.id)}
                              className="ml-auto"
                            >
                              Debug
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAmendments.length)} of {filteredAmendments.length} amendments
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
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Payment Request Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!loadingAmendmentId) setIsDialogOpen(open)
        }}
      >
        <DialogContent>
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
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={isStatusChangeDialogOpen}
        onOpenChange={(open) => {
          if (!loadingAmendmentId) setIsStatusChangeDialogOpen(open)
        }}
      >
        <DialogContent>
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
                  <SelectItem value={AmendmentStatus.PAYMENT_CONFIRMATION_PENDING}>Payment Confirmation Pending</SelectItem>
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
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"
  let label = status.replace(/_/g, " ")
  
  // Capitalize first letter of each word
  label = label.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

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
  }

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}