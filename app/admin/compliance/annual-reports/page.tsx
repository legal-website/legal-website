"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Plus,
  RefreshCw,
  Search,
  SortDesc,
  Trash,
  Upload,
} from "lucide-react"
import { format } from "date-fns"
import { UserRole } from "@/lib/db/schema"

// Types
interface User {
  id: string
  name: string | null
  email: string
  company?: string
}

interface Deadline {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  title: string
  description: string | null
  dueDate: string
  fee: number
  lateFee: number | null
  status: string
  createdAt: string
  user?: {
    name: string | null
    email: string
  }
}

interface Filing {
  id: string
  deadlineId: string
  userId: string
  userName?: string
  userEmail?: string
  deadlineTitle?: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  adminNotes: string | null
  userNotes: string | null
  filedDate: string | null
  createdAt: string
  dueDate?: string
  deadline?: {
    title: string
    dueDate: string
  }
  user?: {
    name: string | null
    email: string
  }
}

interface FilingRequirement {
  id: string
  title: string
  description: string
  details: string | null
  isActive: boolean
  createdAt: string // Add this property
}

// Sort options
type SortOption = "newest" | "oldest" | "dueDate" | "title" | "status" | "user"

export default function AdminAnnualReportsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  // States
  const [activeTab, setActiveTab] = useState("deadlines")
  const [users, setUsers] = useState<User[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [filings, setFilings] = useState<Filing[]>([])
  const [requirements, setRequirements] = useState<FilingRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Sorting states
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Dialog states
  const [showAddDeadlineDialog, setShowAddDeadlineDialog] = useState(false)
  const [showEditDeadlineDialog, setShowEditDeadlineDialog] = useState(false)
  const [showDeleteDeadlineDialog, setShowDeleteDeadlineDialog] = useState(false)
  const [showViewFilingDialog, setShowViewFilingDialog] = useState(false)
  const [showUpdateFilingDialog, setShowUpdateFilingDialog] = useState(false)
  const [showAddRequirementDialog, setShowAddRequirementDialog] = useState(false)
  const [showEditRequirementDialog, setShowEditRequirementDialog] = useState(false)
  const [showDeleteRequirementDialog, setShowDeleteRequirementDialog] = useState(false)

  // Selected items
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<FilingRequirement | null>(null)

  // Form data
  const [deadlineForm, setDeadlineForm] = useState({
    userId: "",
    title: "",
    description: "",
    dueDate: "",
    fee: "0",
    lateFee: "0",
  })

  const [filingForm, setFilingForm] = useState({
    status: "",
    adminNotes: "",
    reportUrl: "",
    reportFile: null as File | null,
  })

  const [requirementForm, setRequirementForm] = useState({
    title: "",
    description: "",
    details: "",
    isActive: true,
  })

  const [searchQuery, setSearchQuery] = useState("")

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (!session) {
      router.push("/login?callbackUrl=/admin/compliance/annual-reports")
      return
    }

    // Only ADMIN users can access this page
    if ((session.user as any).role !== UserRole.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    } else {
      fetchData()

      // Set up auto-refresh every 5 minutes
      const interval = setInterval(
        () => {
          fetchData(false, true) // Use background refresh for auto-refresh
        },
        5 * 60 * 1000,
      )

      return () => clearInterval(interval)
    }
  }, [session, sessionStatus, router, toast])

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, sortBy])

  // Fetch all necessary data
  const fetchData = async (showToast = true, isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    }
    if (showToast && !isBackground) setRefreshing(true)
    if (isBackground) setBackgroundRefreshing(true)

    try {
      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      if (!usersResponse.ok) throw new Error("Failed to fetch users")
      const usersData = await usersResponse.json()
      setUsers(
        usersData.users.map((user: any) => ({
          id: user.id,
          name: user.name || "Unknown",
          email: user.email,
          company: user.business?.name || "Not specified",
        })),
      )

      // Fetch all deadlines
      const deadlinesResponse = await fetch("/api/admin/annual-reports/deadlines")
      if (!deadlinesResponse.ok) throw new Error("Failed to fetch deadlines")
      const deadlinesData = await deadlinesResponse.json()

      // Process deadlines to ensure they have user info
      const processedDeadlines = deadlinesData.deadlines.map((deadline: Deadline) => {
        const user = usersData.users.find((u: any) => u.id === deadline.userId)
        return {
          ...deadline,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "unknown@example.com",
        }
      })

      setDeadlines(processedDeadlines || [])

      // Fetch all filings
      const filingsResponse = await fetch("/api/admin/annual-reports/filings")
      if (!filingsResponse.ok) throw new Error("Failed to fetch filings")
      const filingsData = await filingsResponse.json()

      // Add this debug line:
      console.log("Admin page: Fetched filings:", filingsData.filings?.length || 0)

      // Process filings to ensure they have user info
      const processedFilings = filingsData.filings.map((filing: Filing) => {
        const user = usersData.users.find((u: any) => u.id === filing.userId)
        return {
          ...filing,
          userName: user?.name || filing.user?.name || "Unknown",
          userEmail: user?.email || filing.user?.email || "unknown@example.com",
        }
      })

      setFilings(processedFilings || [])

      // Fetch requirements
      const requirementsResponse = await fetch("/api/admin/annual-reports/requirements")
      if (!requirementsResponse.ok) throw new Error("Failed to fetch requirements")
      const requirementsData = await requirementsResponse.json()
      setRequirements(requirementsData.requirements || [])

      if (showToast && !isBackground && refreshing) {
        toast({
          title: "Refreshed",
          description: "Data has been refreshed successfully.",
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      if (showToast && !isBackground) {
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
      if (showToast && !isBackground) setRefreshing(false)
      setBackgroundRefreshing(false)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchData(true, false)
  }

  // Add a new deadline
  const handleAddDeadline = async () => {
    try {
      const response = await fetch("/api/admin/annual-reports/deadlines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: deadlineForm.userId,
          title: deadlineForm.title,
          description: deadlineForm.description,
          dueDate: new Date(deadlineForm.dueDate).toISOString(),
          fee: Number.parseFloat(deadlineForm.fee),
          lateFee: Number.parseFloat(deadlineForm.lateFee) || null,
          status: "pending",
        }),
      })

      if (!response.ok) throw new Error("Failed to add deadline")

      const data = await response.json()

      // Add the new deadline to the state
      const user = users.find((u) => u.id === data.deadline.userId)
      const newDeadline = {
        ...data.deadline,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "unknown@example.com",
      }

      setDeadlines([...deadlines, newDeadline])
      setShowAddDeadlineDialog(false)

      // Reset form
      setDeadlineForm({
        userId: "",
        title: "",
        description: "",
        dueDate: "",
        fee: "0",
        lateFee: "0",
      })

      toast({
        title: "Deadline Added",
        description: "The deadline has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding deadline:", error)
      toast({
        title: "Error",
        description: "Failed to add deadline. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update a deadline
  const handleUpdateDeadline = async () => {
    if (!selectedDeadline) return

    try {
      const response = await fetch(`/api/admin/annual-reports/deadlines/${selectedDeadline.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: deadlineForm.userId,
          title: deadlineForm.title,
          description: deadlineForm.description,
          dueDate: new Date(deadlineForm.dueDate).toISOString(),
          fee: Number.parseFloat(deadlineForm.fee),
          lateFee: Number.parseFloat(deadlineForm.lateFee) || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to update deadline")

      // Update the deadline in the state
      const user = users.find((u) => u.id === deadlineForm.userId)
      const updatedDeadlines = deadlines.map((deadline) =>
        deadline.id === selectedDeadline.id
          ? {
              ...deadline,
              userId: deadlineForm.userId,
              userName: user?.name || "Unknown",
              userEmail: user?.email || "unknown@example.com",
              title: deadlineForm.title,
              description: deadlineForm.description,
              dueDate: new Date(deadlineForm.dueDate).toISOString(),
              fee: Number.parseFloat(deadlineForm.fee),
              lateFee: Number.parseFloat(deadlineForm.lateFee) || null,
            }
          : deadline,
      )

      setDeadlines(updatedDeadlines)
      setShowEditDeadlineDialog(false)

      toast({
        title: "Deadline Updated",
        description: "The deadline has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating deadline:", error)
      toast({
        title: "Error",
        description: "Failed to update deadline. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete a deadline
  const handleDeleteDeadline = async () => {
    if (!selectedDeadline) return

    try {
      const response = await fetch(`/api/admin/annual-reports/deadlines/${selectedDeadline.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete deadline")

      // Remove the deadline from the state
      const updatedDeadlines = deadlines.filter((deadline) => deadline.id !== selectedDeadline.id)
      setDeadlines(updatedDeadlines)
      setShowDeleteDeadlineDialog(false)

      toast({
        title: "Deadline Deleted",
        description: "The deadline has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting deadline:", error)
      toast({
        title: "Error",
        description: "Failed to delete deadline. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle file upload for report
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFilingForm({
        ...filingForm,
        reportFile: e.target.files[0],
      })
    }
  }

  // Update a filing
  const handleUpdateFiling = async () => {
    if (!selectedFiling) return

    try {
      let reportUrl = filingForm.reportUrl

      // If a file was uploaded, upload it first
      if (filingForm.reportFile) {
        const formData = new FormData()
        formData.append("file", filingForm.reportFile)
        formData.append("type", "report")

        const uploadResponse = await fetch("/api/upload-receipt", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) throw new Error("Failed to upload report")
        const uploadData = await uploadResponse.json()
        reportUrl = uploadData.url
      }

      // Now update the filing
      const response = await fetch(`/api/admin/annual-reports/filings/${selectedFiling.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: filingForm.status,
          adminNotes: filingForm.adminNotes,
          reportUrl: reportUrl || selectedFiling.reportUrl,
          filedDate: filingForm.status === "completed" ? new Date().toISOString() : selectedFiling.filedDate,
        }),
      })

      if (!response.ok) throw new Error("Failed to update filing")

      // Update the filing in the state
      const updatedFilings = filings.map((filing) =>
        filing.id === selectedFiling.id
          ? {
              ...filing,
              status: filingForm.status,
              adminNotes: filingForm.adminNotes,
              reportUrl: reportUrl || filing.reportUrl,
              filedDate: filingForm.status === "completed" ? new Date().toISOString() : filing.filedDate,
            }
          : filing,
      )

      setFilings(updatedFilings)
      setShowUpdateFilingDialog(false)

      toast({
        title: "Filing Updated",
        description: "The filing has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating filing:", error)
      toast({
        title: "Error",
        description: "Failed to update filing. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add a new requirement
  const handleAddRequirement = async () => {
    try {
      const response = await fetch("/api/admin/annual-reports/requirements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: requirementForm.title,
          description: requirementForm.description,
          details: requirementForm.details || null,
          isActive: requirementForm.isActive,
        }),
      })

      if (!response.ok) throw new Error("Failed to add requirement")

      const data = await response.json()

      // Add the new requirement to the state
      setRequirements([...requirements, data.requirement])
      setShowAddRequirementDialog(false)

      // Reset form
      setRequirementForm({
        title: "",
        description: "",
        details: "",
        isActive: true,
      })

      toast({
        title: "Requirement Added",
        description: "The filing requirement has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding requirement:", error)
      toast({
        title: "Error",
        description: "Failed to add requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update a requirement
  const handleUpdateRequirement = async () => {
    if (!selectedRequirement) return

    try {
      const response = await fetch(`/api/admin/annual-reports/requirements/${selectedRequirement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: requirementForm.title,
          description: requirementForm.description,
          details: requirementForm.details || null,
          isActive: requirementForm.isActive,
        }),
      })

      if (!response.ok) throw new Error("Failed to update requirement")

      // Update the requirement in the state
      const updatedRequirements = requirements.map((requirement) =>
        requirement.id === selectedRequirement.id
          ? {
              ...requirement,
              title: requirementForm.title,
              description: requirementForm.description,
              details: requirementForm.details || null,
              isActive: requirementForm.isActive,
            }
          : requirement,
      )

      setRequirements(updatedRequirements)
      setShowEditRequirementDialog(false)

      toast({
        title: "Requirement Updated",
        description: "The filing requirement has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating requirement:", error)
      toast({
        title: "Error",
        description: "Failed to update requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete a requirement
  const handleDeleteRequirement = async () => {
    if (!selectedRequirement) return

    try {
      const response = await fetch(`/api/admin/annual-reports/requirements/${selectedRequirement.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete requirement")

      // Remove the requirement from the state
      const updatedRequirements = requirements.filter((requirement) => requirement.id !== selectedRequirement.id)
      setRequirements(updatedRequirements)
      setShowDeleteRequirementDialog(false)

      toast({
        title: "Requirement Deleted",
        description: "The filing requirement has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting requirement:", error)
      toast({
        title: "Error",
        description: "Failed to delete requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Sort data based on selected option
  const sortData = <T extends Deadline | Filing | FilingRequirement>(data: T[], sortOption: SortOption): T[] => {
    if (data.length === 0) return data

    const sortedData = [...data]

    switch (sortOption) {
      case "newest":
        return sortedData.sort((a, b) => {
          // Check if both items have createdAt property
          if ("createdAt" in a && "createdAt" in b) {
            return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
          }
          return 0
        })
      case "oldest":
        return sortedData.sort((a, b) => {
          // Check if both items have createdAt property
          if ("createdAt" in a && "createdAt" in b) {
            return new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime()
          }
          return 0
        })
      case "dueDate":
        return sortedData.sort((a, b) => {
          // Check if both items have dueDate property
          if ("dueDate" in a && "dueDate" in b) {
            const aDate = new Date(a.dueDate as string).getTime()
            const bDate = new Date(b.dueDate as string).getTime()
            return aDate - bDate
          }
          return 0
        })
      case "title":
        return sortedData.sort((a, b) => {
          // Check if both items have title property
          if ("title" in a && "title" in b) {
            return ((a.title as string) || "").localeCompare((b.title as string) || "")
          }
          return 0
        })
      case "status":
        return sortedData.sort((a, b) => {
          // Check if both items have status property
          if ("status" in a && "status" in b) {
            return (a.status as string).localeCompare(b.status as string)
          }
          return 0
        })
      case "user":
        return sortedData.sort((a, b) => {
          // Check if both items have userName property
          if ("userName" in a && "userName" in b) {
            return ((a.userName as string) || "").localeCompare((b.userName as string) || "")
          }
          return 0
        })
      default:
        return sortedData
    }
  }

  // Filter deadlines based on search query
  const filteredDeadlines = deadlines.filter(
    (deadline) =>
      deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deadline.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deadline.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter filings based on search query
  const filteredFilings = filings.filter(
    (filing) =>
      (filing.deadlineTitle || filing.deadline?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (filing.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (filing.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter requirements based on search query
  const filteredRequirements = requirements.filter(
    (requirement) =>
      requirement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort filtered data
  const sortedDeadlines = sortData(filteredDeadlines, sortBy)
  const sortedFilings = sortData(filteredFilings, sortBy)
  const sortedRequirements = sortData(filteredRequirements, sortBy)

  // Pagination logic
  const getPageItems = <T,>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  // Get current items for the active tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case "deadlines":
        return getPageItems(sortedDeadlines)
      case "filings":
        return getPageItems(sortedFilings)
      case "requirements":
        return getPageItems(sortedRequirements)
      default:
        return []
    }
  }

  // Get total pages for the active tab
  const getTotalPages = () => {
    let totalItems = 0

    switch (activeTab) {
      case "deadlines":
        totalItems = sortedDeadlines.length
        break
      case "filings":
        totalItems = sortedFilings.length
        break
      case "requirements":
        totalItems = sortedRequirements.length
        break
    }

    return Math.ceil(totalItems / itemsPerPage)
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "pending_payment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "payment_received":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#22c984]" />
            </div>
          </div>
          <p className="text-base font-medium text-muted-foreground">Loading annual reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {backgroundRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Annual Reports Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage deadlines, filings, and requirements</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleRefresh}
            disabled={refreshing || backgroundRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, user name, or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger>
              <div className="flex items-center">
                <SortDesc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Annual Report Deadlines</h2>
              <Button onClick={() => setShowAddDeadlineDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deadline
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPageItems(sortedDeadlines).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No deadlines found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPageItems(sortedDeadlines).map((deadline) => (
                      <TableRow key={deadline.id}>
                        <TableCell className="font-medium">{deadline.title}</TableCell>
                        <TableCell>
                          <div>
                            <p>{deadline.userName || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{deadline.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(deadline.dueDate)}</TableCell>
                        <TableCell>${Number(deadline.fee).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(deadline.status)}>
                            {deadline.status.charAt(0).toUpperCase() + deadline.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDeadline(deadline)
                                setDeadlineForm({
                                  userId: deadline.userId,
                                  title: deadline.title,
                                  description: deadline.description || "",
                                  dueDate: deadline.dueDate.split("T")[0], // Format for date input
                                  fee: deadline.fee.toString(),
                                  lateFee: deadline.lateFee?.toString() || "0",
                                })
                                setShowEditDeadlineDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedDeadline(deadline)
                                setShowDeleteDeadlineDialog(true)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, sortedDeadlines.length)} of {sortedDeadlines.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {getTotalPages()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Filings Tab */}
        <TabsContent value="filings">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Annual Report Filings</h2>
              <Button onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Filings
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deadline</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPageItems(sortedFilings).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No filings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPageItems(sortedFilings).map((filing) => (
                      <TableRow key={filing.id}>
                        <TableCell className="font-medium">{filing.deadlineTitle || filing.deadline?.title}</TableCell>
                        <TableCell>
                          <div>
                            <p>{filing.userName || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{filing.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(filing.dueDate || filing.deadline?.dueDate)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(filing.status)}>
                            {filing.status
                              .split("_")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{filing.filedDate ? formatDate(filing.filedDate) : "Not filed yet"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFiling(filing)
                                setShowViewFilingDialog(true)
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFiling(filing)
                                setFilingForm({
                                  status: filing.status,
                                  adminNotes: filing.adminNotes || "",
                                  reportUrl: filing.reportUrl || "",
                                  reportFile: null,
                                })
                                setShowUpdateFilingDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, sortedFilings.length)} of {sortedFilings.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {getTotalPages()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Filing Requirements</h2>
              <Button onClick={() => setShowAddRequirementDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Requirement
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPageItems(sortedRequirements).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No requirements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPageItems(sortedRequirements).map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell className="font-medium">{requirement.title}</TableCell>
                        <TableCell>{requirement.description}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              requirement.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {requirement.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequirement(requirement)
                                setRequirementForm({
                                  title: requirement.title,
                                  description: requirement.description,
                                  details: requirement.details || "",
                                  isActive: requirement.isActive,
                                })
                                setShowEditRequirementDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedRequirement(requirement)
                                setShowDeleteRequirementDialog(true)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, sortedRequirements.length)} of {sortedRequirements.length}{" "}
                  entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {getTotalPages()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Deadline Dialog */}
      <Dialog open={showAddDeadlineDialog} onOpenChange={setShowAddDeadlineDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Deadline</DialogTitle>
            <DialogDescription>Create a new annual report deadline for a user</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="userId">User</Label>
              <Select
                value={deadlineForm.userId}
                onValueChange={(value) => setDeadlineForm({ ...deadlineForm, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || "Unknown"} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={deadlineForm.title}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                placeholder="Annual Report 2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={deadlineForm.description}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, description: e.target.value })}
                placeholder="Description of the annual report filing"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={deadlineForm.dueDate}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, dueDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee">Fee ($)</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  value={deadlineForm.fee}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, fee: e.target.value })}
                  placeholder="75.00"
                />
              </div>

              <div>
                <Label htmlFor="lateFee">Late Fee ($)</Label>
                <Input
                  id="lateFee"
                  name="lateFee"
                  type="number"
                  value={deadlineForm.lateFee}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, lateFee: e.target.value })}
                  placeholder="25.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDeadlineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDeadline}>Add Deadline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deadline Dialog */}
      <Dialog open={showEditDeadlineDialog} onOpenChange={setShowEditDeadlineDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Deadline</DialogTitle>
            <DialogDescription>Update the annual report deadline</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="userId">User</Label>
              <Select
                value={deadlineForm.userId}
                onValueChange={(value) => setDeadlineForm({ ...deadlineForm, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || "Unknown"} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={deadlineForm.title}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={deadlineForm.description}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={deadlineForm.dueDate}
                onChange={(e) => setDeadlineForm({ ...deadlineForm, dueDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee">Fee ($)</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  value={deadlineForm.fee}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, fee: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="lateFee">Late Fee ($)</Label>
                <Input
                  id="lateFee"
                  name="lateFee"
                  type="number"
                  value={deadlineForm.lateFee}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, lateFee: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDeadlineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDeadline}>Update Deadline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Deadline Dialog */}
      <AlertDialog open={showDeleteDeadlineDialog} onOpenChange={setShowDeleteDeadlineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deadline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deadline? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeadline} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Filing Dialog */}
      {selectedFiling && (
        <Dialog open={showViewFilingDialog} onOpenChange={setShowViewFilingDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Filing Details</DialogTitle>
              <DialogDescription>
                View details for {selectedFiling.deadlineTitle || selectedFiling.deadline?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">User</h3>
                  <p>{selectedFiling.userName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedFiling.userEmail}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Status</h3>
                  <Badge className={getStatusBadgeColor(selectedFiling.status)}>
                    {selectedFiling.status
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Due Date</h3>
                  <p>{formatDate(selectedFiling.dueDate || selectedFiling.deadline?.dueDate)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Filed Date</h3>
                  <p>{selectedFiling.filedDate ? formatDate(selectedFiling.filedDate) : "Not filed yet"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedFiling.receiptUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Payment Receipt</h3>
                    <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                      <img
                        src={selectedFiling.receiptUrl || "/placeholder.svg"}
                        alt="Payment Receipt"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFiling.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {selectedFiling.reportUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Filed Report</h3>
                    <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                      <FileText className="h-16 w-16 text-gray-300" />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFiling.reportUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFiling.userNotes && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">User Notes</h3>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedFiling.userNotes}</p>
                  </div>
                )}

                {selectedFiling.adminNotes && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Admin Notes</h3>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedFiling.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewFilingDialog(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewFilingDialog(false)
                  setFilingForm({
                    status: selectedFiling.status,
                    adminNotes: selectedFiling.adminNotes || "",
                    reportUrl: selectedFiling.reportUrl || "",
                    reportFile: null,
                  })
                  setShowUpdateFilingDialog(true)
                }}
              >
                Update Filing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Filing Dialog */}
      {selectedFiling && (
        <Dialog open={showUpdateFilingDialog} onOpenChange={setShowUpdateFilingDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Update Filing</DialogTitle>
              <DialogDescription>Update the filing status and upload report</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filingForm.status}
                  onValueChange={(value) => setFilingForm({ ...filingForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="payment_received">Payment Received</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  name="adminNotes"
                  value={filingForm.adminNotes}
                  onChange={(e) => setFilingForm({ ...filingForm, adminNotes: e.target.value })}
                  placeholder="Add notes about this filing"
                />
              </div>

              <div>
                <Label htmlFor="reportUrl">Report URL</Label>
                <Input
                  id="reportUrl"
                  name="reportUrl"
                  value={filingForm.reportUrl}
                  onChange={(e) => setFilingForm({ ...filingForm, reportUrl: e.target.value })}
                  placeholder="URL to the filed report document"
                />
              </div>

              <div>
                <Label htmlFor="reportFile">Or Upload Report File</Label>
                <div className="border-2 border-dashed rounded-md p-6 text-center mt-2">
                  <input
                    type="file"
                    id="reportFile"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="reportFile" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium mb-1">Click to upload</p>
                      <p className="text-xs text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                    </div>
                  </label>
                  {filingForm.reportFile && (
                    <div className="mt-4 p-2 bg-green-50 rounded text-sm text-green-700 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {filingForm.reportFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateFilingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFiling}>Update Filing</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Requirement Dialog */}
      <Dialog open={showAddRequirementDialog} onOpenChange={setShowAddRequirementDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Filing Requirement</DialogTitle>
            <DialogDescription>Create a new filing requirement</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={requirementForm.title}
                onChange={(e) => setRequirementForm({ ...requirementForm, title: e.target.value })}
                placeholder="Annual Report"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={requirementForm.description}
                onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })}
                placeholder="Description of the filing requirement"
              />
            </div>

            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                name="details"
                value={requirementForm.details}
                onChange={(e) => setRequirementForm({ ...requirementForm, details: e.target.value })}
                placeholder="Additional details like fees, deadlines, etc."
              />
              <p className="text-sm text-muted-foreground mt-1">Use line breaks to separate items</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={requirementForm.isActive}
                onChange={(e) => setRequirementForm({ ...requirementForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRequirementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRequirement}>Add Requirement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Requirement Dialog */}
      <Dialog open={showEditRequirementDialog} onOpenChange={setShowEditRequirementDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Filing Requirement</DialogTitle>
            <DialogDescription>Update the filing requirement</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={requirementForm.title}
                onChange={(e) => setRequirementForm({ ...requirementForm, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={requirementForm.description}
                onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                name="details"
                value={requirementForm.details}
                onChange={(e) => setRequirementForm({ ...requirementForm, details: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">Use line breaks to separate items</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={requirementForm.isActive}
                onChange={(e) => setRequirementForm({ ...requirementForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRequirementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequirement}>Update Requirement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Requirement Dialog */}
      <AlertDialog open={showDeleteRequirementDialog} onOpenChange={setShowDeleteRequirementDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this filing requirement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequirement} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

