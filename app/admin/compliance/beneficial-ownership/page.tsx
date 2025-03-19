"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FilterX,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

import type React from "react"

// Define Role enum since we can't import it directly
enum Role {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  CLIENT = "CLIENT",
}

interface Owner {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    business?: {
      name: string
    }
  }
  name: string
  title: string
  ownershipPercentage: number
  dateAdded: string
  status: "pending" | "reported"
  isDefault?: boolean
}

interface User {
  id: string
  name: string
  email: string
  business?: {
    name: string
  }
}

export default function AdminBeneficialOwnershipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [owners, setOwners] = useState<Owner[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedClient, setSelectedClient] = useState("All Clients")
  const [isTableChecked, setIsTableChecked] = useState(false)

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "pending" | "reported" | "none">("newest")
  const [dateFilter, setDateFilter] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: "",
    endDate: "",
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch owners and users when component mounts
  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== Role.ADMIN) {
        router.push("/dashboard")
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
      } else {
        checkTable()
      }
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/compliance/beneficial-ownership")
    }
  }, [status, session, router])

  const checkTable = async () => {
    try {
      const response = await fetch("/api/beneficial-ownership/check-table")
      const data = await response.json()

      if (data.tableExists) {
        setIsTableChecked(true)
        fetchData()
      } else {
        toast({
          title: "Database Setup Required",
          description: "The beneficial ownership table does not exist. Would you like to create it?",
          action: (
            <Button variant="default" size="sm" onClick={createTable}>
              Create Table
            </Button>
          ),
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error checking table:", error)
      toast({
        title: "Error",
        description: "Failed to check database setup. Please try again later.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const createTable = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/beneficial-ownership/create-table")
      const data = await response.json()

      if (data.tableCreated || data.tableExists) {
        toast({
          title: "Success",
          description: "Beneficial ownership table has been created successfully.",
        })
        setIsTableChecked(true)
        fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to create beneficial ownership table.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error creating table:", error)
      toast({
        title: "Error",
        description: "Failed to create beneficial ownership table.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchOwners(), fetchUsers()])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const response = await fetch("/api/beneficial-ownership")
      const data = await response.json()

      if (data.owners) {
        setOwners(data.owners)
      }
    } catch (error) {
      console.error("Error fetching owners:", error)
      throw error
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchData()
      toast({
        title: "Refreshed",
        description: "Data has been refreshed successfully.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleViewOwner = (owner: Owner) => {
    setSelectedOwner(owner)
    setShowViewDialog(true)
  }

  const handleChangeStatus = (owner: Owner) => {
    setSelectedOwner(owner)
    setShowStatusDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedOwner) return

    const newStatus = selectedOwner.status === "pending" ? "reported" : "pending"

    try {
      const response = await fetch(`/api/admin/beneficial-ownership/status/${selectedOwner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status")
      }

      // Update owner status in the local state
      const updatedOwners = owners.map((owner) => {
        if (owner.id === selectedOwner.id) {
          return { ...owner, status: newStatus as "pending" | "reported" }
        }
        return owner
      })

      setOwners(updatedOwners)
      setShowStatusDialog(false)

      toast({
        title: "Status Updated",
        description: `Owner status has been changed to ${newStatus}.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update status.",
        variant: "destructive",
      })
    }
  }

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest" | "pending" | "reported" | "none")
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Validate date range
    if (name === "startDate" && dateFilter.endDate && value) {
      const startDateVal = new Date(value)
      const endDateVal = new Date(dateFilter.endDate)

      if (startDateVal > endDateVal) {
        toast({
          title: "Invalid Date Range",
          description: "Start date cannot be after end date",
          variant: "destructive",
        })
        return
      }
    }

    if (name === "endDate" && dateFilter.startDate && value) {
      const startDateVal = new Date(dateFilter.startDate)
      const endDateVal = new Date(value)

      if (startDateVal > endDateVal) {
        toast({
          title: "Invalid Date Range",
          description: "End date cannot be before start date",
          variant: "destructive",
        })
        return
      }
    }

    setDateFilter((prev) => ({ ...prev, [name]: value }))
    setCurrentPage(1) // Reset to first page when date filter changes
  }

  const resetFilters = () => {
    setSortOrder("newest")
    setDateFilter({ startDate: "", endDate: "" })
    setSelectedClient("All Clients")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const exportOwnerData = () => {
    // Define the headers for the CSV file
    const headers = ["ID", "Client", "Name", "Title", "Ownership %", "Date Added", "Status"]

    // Convert owner data to CSV format
    const ownerDataCSV = filteredOwners.map((owner) => [
      owner.id,
      owner.user?.name || "Unknown",
      owner.name,
      owner.title,
      owner.ownershipPercentage,
      formatDate(owner.dateAdded),
      owner.status,
    ])

    // Combine headers and data
    const csvContent = [headers.join(","), ...ownerDataCSV.map((row) => row.join(","))].join("\n")

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link and trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `beneficial-ownership-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter and sort owners
  const filteredOwners = owners
    .filter((owner) => {
      const matchesSearch =
        owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (owner.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.title.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTab =
        (activeTab === "pending" && owner.status === "pending") ||
        (activeTab === "reported" && owner.status === "reported") ||
        activeTab === "all"

      const matchesClient = selectedClient === "All Clients" || (owner.user?.name || "Unknown") === selectedClient

      // Add date filtering
      let matchesDateFilter = true
      if (dateFilter.startDate) {
        const ownerDate = new Date(owner.dateAdded)
        const filterStartDate = new Date(dateFilter.startDate)
        matchesDateFilter = ownerDate >= filterStartDate
      }

      if (dateFilter.endDate && matchesDateFilter) {
        const ownerDate = new Date(owner.dateAdded)
        const filterEndDate = new Date(dateFilter.endDate)
        // Set end date to end of day
        filterEndDate.setHours(23, 59, 59, 999)
        matchesDateFilter = ownerDate <= filterEndDate
      }

      return matchesSearch && matchesTab && matchesClient && matchesDateFilter
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortOrder === "newest") {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      } else if (sortOrder === "oldest") {
        return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
      } else if (sortOrder === "pending") {
        if (a.status === "pending" && b.status !== "pending") return -1
        if (a.status !== "pending" && b.status === "pending") return 1
        return 0
      } else if (sortOrder === "reported") {
        if (a.status === "reported" && b.status !== "reported") return -1
        if (a.status !== "reported" && b.status === "reported") return 1
        return 0
      }
      return 0
    })

  // Add pagination calculation
  const paginatedOwners = filteredOwners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage)

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getStatusBadge = (status: string) => {
    if (status === "reported") {
      return <Badge className="bg-green-100 text-green-800">Reported</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#22c984]" />
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading ownership information...</p>
        </div>
      </div>
    )
  }

  if (!isTableChecked) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold mb-4">Database Setup Required</h2>
          <p className="mb-4">The beneficial ownership table does not exist in the database.</p>
          <p className="mb-6">Would you like to create the required table now?</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={checkTable}>
              Check Again
            </Button>
            <Button onClick={createTable}>Create Table</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Beneficial Ownership Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and review beneficial ownership information for all clients
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportOwnerData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search owners..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Clients">All Clients</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.name}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger>
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>
                  {sortOrder === "newest"
                    ? "Newest First"
                    : sortOrder === "oldest"
                      ? "Oldest First"
                      : sortOrder === "pending"
                        ? "Pending First"
                        : sortOrder === "reported"
                          ? "Reported First"
                          : "Sort Owners"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="pending">Pending First</SelectItem>
              <SelectItem value="reported">Reported First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="date"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilterChange}
              placeholder="Start Date"
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="date"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilterChange}
              placeholder="End Date"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(sortOrder !== "newest" ||
        dateFilter.startDate ||
        dateFilter.endDate ||
        selectedClient !== "All Clients" ||
        searchQuery) && (
        <div className="flex items-center mb-4 p-2 bg-muted rounded-md">
          <div className="flex-1 flex flex-wrap gap-2">
            <span className="text-sm font-medium">Active Filters:</span>
            {sortOrder !== "newest" && (
              <Badge variant="outline" className="mr-2">
                {sortOrder === "oldest" ? "Oldest First" : sortOrder === "pending" ? "Pending First" : "Reported First"}
              </Badge>
            )}
            {dateFilter.startDate && (
              <Badge variant="outline" className="mr-2">
                From: {format(new Date(dateFilter.startDate), "MMM dd, yyyy")}
              </Badge>
            )}
            {dateFilter.endDate && (
              <Badge variant="outline" className="mr-2">
                To: {format(new Date(dateFilter.endDate), "MMM dd, yyyy")}
              </Badge>
            )}
            {selectedClient !== "All Clients" && (
              <Badge variant="outline" className="mr-2">
                Client: {selectedClient}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="mr-2">
                Search: {searchQuery}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <FilterX className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Owners</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reported">Reported</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OwnerTable
            owners={paginatedOwners}
            onView={handleViewOwner}
            onChangeStatus={handleChangeStatus}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
          {/* Pagination */}
          {filteredOwners.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOwners.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOwners.length)}</span> of{" "}
                <span className="font-medium">{filteredOwners.length}</span> owners
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show first page, last page, current page, and pages around current
                  let pageToShow: number | null = null

                  if (i === 0) pageToShow = 1
                  else if (i === 4) pageToShow = totalPages
                  else if (totalPages <= 5) pageToShow = i + 1
                  else {
                    // For middle buttons, calculate based on current page
                    if (currentPage <= 3) {
                      pageToShow = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    } else {
                      pageToShow = currentPage - 1 + i
                    }
                  }

                  if (pageToShow !== null) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(pageToShow as number)}
                        className={`h-8 w-8 ${currentPage === pageToShow ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                      >
                        {pageToShow}
                        <span className="sr-only">Page {pageToShow}</span>
                      </Button>
                    )
                  }
                  return null
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <OwnerTable
            owners={paginatedOwners}
            onView={handleViewOwner}
            onChangeStatus={handleChangeStatus}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
          {/* Pagination (same as above) */}
          {filteredOwners.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOwners.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOwners.length)}</span> of{" "}
                <span className="font-medium">{filteredOwners.length}</span> owners
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageToShow: number | null = null

                  if (i === 0) pageToShow = 1
                  else if (i === 4) pageToShow = totalPages
                  else if (totalPages <= 5) pageToShow = i + 1
                  else {
                    if (currentPage <= 3) {
                      pageToShow = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    } else {
                      pageToShow = currentPage - 1 + i
                    }
                  }

                  if (pageToShow !== null) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(pageToShow as number)}
                        className={`h-8 w-8 ${currentPage === pageToShow ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                      >
                        {pageToShow}
                        <span className="sr-only">Page {pageToShow}</span>
                      </Button>
                    )
                  }
                  return null
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reported">
          <OwnerTable
            owners={paginatedOwners}
            onView={handleViewOwner}
            onChangeStatus={handleChangeStatus}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
          {/* Pagination (same as above) */}
          {filteredOwners.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOwners.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOwners.length)}</span> of{" "}
                <span className="font-medium">{filteredOwners.length}</span> owners
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageToShow: number | null = null

                  if (i === 0) pageToShow = 1
                  else if (i === 4) pageToShow = totalPages
                  else if (totalPages <= 5) pageToShow = i + 1
                  else {
                    if (currentPage <= 3) {
                      pageToShow = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    } else {
                      pageToShow = currentPage - 1 + i
                    }
                  }

                  if (pageToShow !== null) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(pageToShow as number)}
                        className={`h-8 w-8 ${currentPage === pageToShow ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                      >
                        {pageToShow}
                        <span className="sr-only">Page {pageToShow}</span>
                      </Button>
                    )
                  }
                  return null
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Owner Dialog */}
      {selectedOwner && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Beneficial Owner Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedOwner.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedOwner.title}</p>
                  </div>
                  <div className="ml-auto">{getStatusBadge(selectedOwner.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ownership Percentage</p>
                    <p className="font-medium">{selectedOwner.ownershipPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Added</p>
                    <p className="font-medium">{formatDate(selectedOwner.dateAdded)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Client Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">{selectedOwner.user?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{selectedOwner.user?.email || "No email"}</p>
                    </div>
                    <div className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setShowViewDialog(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false)
                    handleChangeStatus(selectedOwner)
                  }}
                >
                  {selectedOwner.status === "pending" ? "Mark as Reported" : "Mark as Pending"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Status Dialog */}
      {selectedOwner && (
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Owner Status</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">
                Are you sure you want to change the status of <span className="font-medium">{selectedOwner.name}</span>{" "}
                from <span className="font-medium">{selectedOwner.status}</span> to{" "}
                <span className="font-medium">{selectedOwner.status === "pending" ? "reported" : "pending"}</span>?
              </p>

              {selectedOwner.status === "pending" ? (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-800">
                      Marking as reported confirms that this ownership information has been properly filed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm text-yellow-800">
                      Marking as pending indicates that this ownership information needs to be reviewed or updated.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                className={selectedOwner.status === "pending" ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}
              >
                {selectedOwner.status === "pending" ? "Mark as Reported" : "Mark as Pending"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Owner Table Component
function OwnerTable({
  owners,
  onView,
  onChangeStatus,
  formatDate,
  getStatusBadge,
}: {
  owners: Owner[]
  onView: (owner: Owner) => void
  onChangeStatus: (owner: Owner) => void
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => React.ReactNode
}) {
  if (owners.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No owners found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No beneficial owners match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Ownership %</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell>{owner.user?.name || "Unknown"}</TableCell>
                <TableCell className="font-medium">{owner.name}</TableCell>
                <TableCell>{owner.title}</TableCell>
                <TableCell>{owner.ownershipPercentage}%</TableCell>
                <TableCell>{formatDate(owner.dateAdded)}</TableCell>
                <TableCell>{getStatusBadge(owner.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onView(owner)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant={owner.status === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onChangeStatus(owner)}
                      className={owner.status === "pending" ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}
                    >
                      {owner.status === "pending" ? "Approve" : "Pending"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

