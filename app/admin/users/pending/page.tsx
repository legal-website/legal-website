"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Eye, Copy, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Role } from "@prisma/client"

// Define interfaces for type safety
interface PendingUser {
  id: string
  name: string
  email: string
  business?: {
    id?: string
    name: string
    businessId: string
    ein: string
    formationDate: string
    serviceStatus: string
    llcStatusMessage?: string
    llcProgress?: number
  }
}

export default function PendingUsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  // Get the tab from URL or default to "all"
  const initialTab = searchParams?.get("tab") || "all"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [businessFormData, setBusinessFormData] = useState({
    name: "",
    businessId: "",
    ein: "",
    formationDate: "",
    serviceStatus: "Pending",
    llcStatusMessage: "LLC formation initiated",
    llcProgress: 10,
  })
  const [processingAction, setProcessingAction] = useState(false)

  // Add these new state variables after the existing state declarations
  const [sortOrder, setSortOrder] = useState("newest")
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.pushState({}, "", url.toString())
    // Reset to first page when tab changes
    setCurrentPage(1)
  }, [activeTab])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortOrder, dateFilter])

  // Fetch users
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchUsers()
    } else if (sessionStatus === "authenticated" && (session?.user as any)?.role !== Role.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [sessionStatus, session, router, toast])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Fetch all users regardless of status to populate all tabs
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()

      // Process the users to extract business data
      const processedUsers = await Promise.all(
        data.users.map(async (user: any) => {
          // Fetch business data for each user
          const businessData = await fetchUserBusinessData(user.id)
          return {
            id: user.id,
            name: user.name || "Unknown",
            email: user.email || "",
            business: businessData || undefined,
          }
        }),
      )

      setPendingUsers(processedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBusinessData = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/business`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.business) {
          return {
            id: data.business.id,
            name: data.business.name || "",
            businessId: data.business.businessId || generateBusinessId(),
            ein: data.business.ein || "",
            formationDate: data.business.formationDate
              ? new Date(data.business.formationDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            serviceStatus: data.business.serviceStatus || "Pending",
            llcStatusMessage: data.business.llcStatusMessage || "LLC formation initiated",
            llcProgress: data.business.llcProgress || 10,
          }
        }
      }

      // Return default values if no business data found
      return {
        name: "",
        businessId: generateBusinessId(),
        ein: "",
        formationDate: new Date().toISOString().split("T")[0],
        serviceStatus: "Pending",
        llcStatusMessage: "LLC formation initiated",
        llcProgress: 10,
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
      return null
    }
  }

  const generateBusinessId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString()
  }

  const viewUserDetails = async (user: PendingUser) => {
    try {
      // Use the business data we already have
      if (user.business) {
        setBusinessFormData({
          name: user.business.name || "",
          businessId: user.business.businessId || generateBusinessId(),
          ein: user.business.ein || "",
          formationDate: user.business.formationDate || new Date().toISOString().split("T")[0],
          serviceStatus: user.business.serviceStatus || "Pending",
          llcStatusMessage: user.business.llcStatusMessage || "LLC formation initiated",
          llcProgress: user.business.llcProgress || 10,
        })
        setSelectedUser(user)
        setShowUserDialog(true)
      } else {
        // Fetch fresh data if we don't have it
        const businessData = await fetchUserBusinessData(user.id)
        if (businessData) {
          setBusinessFormData({
            name: businessData.name || "",
            businessId: businessData.businessId || generateBusinessId(),
            ein: businessData.ein || "",
            formationDate: businessData.formationDate || new Date().toISOString().split("T")[0],
            serviceStatus: businessData.serviceStatus || "Pending",
            llcStatusMessage: businessData.llcStatusMessage || "LLC formation initiated",
            llcProgress: businessData.llcProgress || 10,
          })
          setSelectedUser(user)
          setShowUserDialog(true)
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Don't allow businessId to be changed
    if (name === "businessId") return

    setBusinessFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setBusinessFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    setBusinessFormData((prev) => ({ ...prev, llcProgress: value }))
  }

  const saveBusinessData = async () => {
    if (!selectedUser) return

    setProcessingAction(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(businessFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to update business information")
      }

      toast({
        title: "Success",
        description: "Business information updated successfully.",
      })

      // Update the user in the local state
      setPendingUsers((prev) =>
        prev.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              business: {
                ...(user.business || {}),
                name: businessFormData.name,
                businessId: businessFormData.businessId,
                ein: businessFormData.ein,
                formationDate: businessFormData.formationDate,
                serviceStatus: businessFormData.serviceStatus,
                llcStatusMessage: businessFormData.llcStatusMessage,
                llcProgress: businessFormData.llcProgress,
              },
            }
          }
          return user
        }),
      )

      setShowUserDialog(false)

      // Refresh the data to ensure we have the latest
      fetchUsers()
    } catch (error) {
      console.error("Error updating business information:", error)
      toast({
        title: "Error",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Add this function before the filteredUsers declaration
  const sortUsers = (users: PendingUser[]) => {
    return [...users].sort((a, b) => {
      // Sort by formation date
      const dateA = a.business?.formationDate ? new Date(a.business.formationDate).getTime() : 0
      const dateB = b.business?.formationDate ? new Date(b.business.formationDate).getTime() : 0

      if (sortOrder === "newest") {
        return dateB - dateA
      } else if (sortOrder === "oldest") {
        return dateA - dateB
      } else if (sortOrder === "pendingFirst") {
        return (a.business?.serviceStatus === "Pending" ? -1 : 1) - (b.business?.serviceStatus === "Pending" ? -1 : 1)
      } else if (sortOrder === "approvedFirst") {
        return (a.business?.serviceStatus === "Approved" ? -1 : 1) - (b.business?.serviceStatus === "Approved" ? -1 : 1)
      }

      return 0
    })
  }

  // Modify the filteredUsers declaration to include sorting and date filtering
  const filteredUsers = sortUsers(
    pendingUsers.filter((user) => {
      // First filter by search query
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.business?.name?.toLowerCase().includes(searchQuery.toLowerCase())

      // Then filter by tab (service status)
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && user.business?.serviceStatus === "Pending") ||
        (activeTab === "approved" && user.business?.serviceStatus === "Approved") ||
        (activeTab === "rejected" && user.business?.serviceStatus === "Rejected")

      // Filter by date range if set
      let matchesDateRange = true
      if (dateFilter.startDate && user.business?.formationDate) {
        const formationDate = new Date(user.business.formationDate)
        const startDate = new Date(dateFilter.startDate)

        if (formationDate < startDate) {
          matchesDateRange = false
        }
      }

      if (dateFilter.endDate && user.business?.formationDate) {
        const formationDate = new Date(user.business.formationDate)
        const endDate = new Date(dateFilter.endDate)
        endDate.setHours(23, 59, 59, 999) // Set to end of day

        if (formationDate > endDate) {
          matchesDateRange = false
        }
      }

      return matchesSearch && matchesTab && matchesDateRange
    }),
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        })
      },
    )
  }

  if (sessionStatus === "loading" || !session) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </Card>
    )
  }

  // Count users by service status
  const pendingCount = pendingUsers.filter((user) => user.business?.serviceStatus === "Pending").length
  const approvedCount = pendingUsers.filter((user) => user.business?.serviceStatus === "Approved").length
  const rejectedCount = pendingUsers.filter((user) => user.business?.serviceStatus === "Rejected").length

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">LLC Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage business information and LLC status</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={fetchUsers}>
            <Filter className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Replace the search div with this updated version that includes filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative md:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="pendingFirst">Pending First</SelectItem>
                <SelectItem value="approvedFirst">Approved First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div>
              <Input
                type="date"
                placeholder="Start Date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="End Date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full"
              />
            </div>
            {(dateFilter.startDate || dateFilter.endDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                className="shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Clear dates</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending LLC ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved LLC ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected LLC ({rejectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserList users={paginatedUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </TabsContent>

        <TabsContent value="pending">
          <UserList users={paginatedUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </TabsContent>

        <TabsContent value="approved">
          <UserList users={paginatedUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <UserList users={paginatedUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* LLC Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>LLC Management</DialogTitle>
              <DialogDescription>Update business information and LLC status</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">User Information</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </Card>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Business Information</h3>
                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Business Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={businessFormData.name}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessId">Business ID (Auto-generated)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="businessId"
                          name="businessId"
                          value={businessFormData.businessId}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(businessFormData.businessId, "Business ID")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ein">EIN Number</Label>
                      <Input
                        id="ein"
                        name="ein"
                        value={businessFormData.ein}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="formationDate">Formation Date</Label>
                      <Input
                        id="formationDate"
                        name="formationDate"
                        type="date"
                        value={businessFormData.formationDate}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="serviceStatus">Service Status</Label>
                      <Select
                        value={businessFormData.serviceStatus}
                        onValueChange={(value) => handleSelectChange("serviceStatus", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="llcStatusMessage">LLC Status Message</Label>
                      <Input
                        id="llcStatusMessage"
                        name="llcStatusMessage"
                        value={businessFormData.llcStatusMessage}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="llcProgress">LLC Progress ({businessFormData.llcProgress}%)</Label>
                      <Input
                        id="llcProgress"
                        name="llcProgress"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={businessFormData.llcProgress}
                        onChange={handleProgressChange}
                        className="mt-1"
                      />
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full ${
                            businessFormData.llcProgress >= 100
                              ? "bg-green-500"
                              : businessFormData.llcProgress >= 70
                                ? "bg-green-400"
                                : "bg-blue-500"
                          } rounded-full`}
                          style={{ width: `${businessFormData.llcProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveBusinessData} disabled={processingAction}>
                {processingAction ? "Saving..." : "Save Business Info"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)

      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Add pages in the middle
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push(-2) // -2 represents ellipsis
      }

      // Always include last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-sm text-gray-500 mb-4 sm:mb-0">
        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {pageNumbers.map((pageNumber, index) => {
          // Render ellipsis
          if (pageNumber < 0) {
            return (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            )
          }

          // Render page number
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}

// Separate component for the user list
function UserList({
  users,
  onViewDetails,
  copyToClipboard,
}: {
  users: PendingUser[]
  onViewDetails: (user: PendingUser) => void
  copyToClipboard: (text: string, label: string) => void
}) {
  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p>No users found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-1">
                <p className="font-medium">{user.name}</p>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex flex-wrap items-center mt-1 gap-y-1">
                <span className="text-xs text-gray-500">Business: {user.business?.name || "Not set"}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-xs text-gray-500">Status: {user.business?.serviceStatus || "Pending"}</span>
                {user.business?.businessId && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      ID: {user.business.businessId}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => copyToClipboard(user.business?.businessId || "", "Business ID")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                  </>
                )}
                {user.business?.formationDate && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Formation: {new Date(user.business.formationDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <Button variant="outline" size="sm" onClick={() => onViewDetails(user)}>
                <Eye className="h-4 w-4 mr-2" />
                Manage LLC
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

