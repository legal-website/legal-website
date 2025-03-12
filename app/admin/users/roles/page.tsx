"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Shield,
  User,
  Calendar,
  Mail,
  Building,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  CalendarIcon,
  FilterX,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
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
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

// Define the UserData interface
interface UserData {
  id: string
  name: string
  email: string
  company: string
  role: Role
  status: "Active" | "Pending" | "Inactive" | "Suspended" | "Validation Email Sent"
  joinDate: string
  joinDateObj?: Date // For sorting purposes
  lastActive: string
  profileImage?: string
  isOnline?: boolean
}

type SortOrder = "newest" | "oldest" | "none"

export default function UserRolesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [newRole, setNewRole] = useState<Role | "">("")
  const [processingAction, setProcessingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState<SortOrder>("none")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Fetch users from the API
  const fetchUsers = async () => {
    if (sessionStatus !== "authenticated") return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/users", {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        let errorMessage = "Failed to fetch users"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = "Server returned an error"
        }

        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error("Invalid JSON response from server")
      }

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Invalid response format from server")
      }

      // Format the user data for display
      const formattedUsers = data.users.map((user: any) => {
        // Parse the join date into a Date object for sorting
        const joinDateStr =
          user.joinDate ||
          (user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Unknown")

        // Try to parse the join date into a Date object
        let joinDateObj
        try {
          joinDateObj = user.createdAt ? new Date(user.createdAt) : user.joinDate ? new Date(user.joinDate) : new Date()
        } catch (e) {
          joinDateObj = new Date()
        }

        return {
          id: user.id,
          name: user.name || "Unknown",
          email: user.email,
          company: user.company || "Not specified",
          role: user.role || Role.CLIENT,
          status: user.status || "Active",
          joinDate: joinDateStr,
          joinDateObj: joinDateObj,
          lastActive: user.lastActive
            ? new Date(user.lastActive).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Never",
          profileImage: user.profileImage || user.image || null,
          isOnline: user.isOnline || false,
        }
      })

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError((error as Error).message || "Failed to load users. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (!session) {
      router.push("/login?callbackUrl=/admin/users/roles")
      return
    }

    // Only ADMIN users can access this page
    if ((session.user as any).role !== Role.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [session, sessionStatus, router, toast])

  // Fetch users when session is authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchUsers()
    }
  }, [sessionStatus, session])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, sortOrder, dateRange])

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    // First filter by search query and tab
    let result = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTab =
        (activeTab === "admin" && user.role === Role.ADMIN) ||
        (activeTab === "support" && user.role === Role.SUPPORT) ||
        (activeTab === "client" && user.role === Role.CLIENT) ||
        activeTab === "all"

      // Filter by date range if set
      const matchesDateRange =
        !dateRange.from ||
        !dateRange.to ||
        (user.joinDateObj &&
          dateRange.from &&
          dateRange.to &&
          dateRange.from <= dateRange.to && // Only apply filter if range is valid
          user.joinDateObj >= dateRange.from &&
          user.joinDateObj <= dateRange.to)

      return matchesSearch && matchesTab && matchesDateRange
    })

    // Then sort by join date if sort order is set
    if (sortOrder !== "none") {
      result = [...result].sort((a, b) => {
        if (!a.joinDateObj || !b.joinDateObj) return 0

        return sortOrder === "newest"
          ? b.joinDateObj.getTime() - a.joinDateObj.getTime()
          : a.joinDateObj.getTime() - b.joinDateObj.getTime()
      })
    }

    return result
  }, [users, searchQuery, activeTab, sortOrder, dateRange])

  // Paginate the filtered and sorted users
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedUsers.slice(startIndex, endIndex)
  }, [filteredAndSortedUsers, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)

  const handleChangeRole = (user: UserData) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowChangeRoleDialog(true)
  }

  const confirmChangeRole = async () => {
    if (!selectedUser || !newRole) return

    setProcessingAction(true)

    try {
      // Use the API endpoint to change a user's role
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to change user role")
      }

      // Update user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === selectedUser.id ? { ...user, role: newRole as Role } : user)),
      )

      setShowChangeRoleDialog(false)

      toast({
        title: "Role Updated",
        description: `${selectedUser.name}'s role has been updated to ${newRole}.`,
      })
    } catch (error) {
      console.error("Error changing role:", error)
      toast({
        title: "Error",
        description: "Failed to change user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
      case Role.SUPPORT:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case Role.CLIENT:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "Inactive":
      case "Suspended":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleSortChange = (value: string) => {
    setSortOrder(value as SortOrder)
  }

  const resetFilters = () => {
    setSortOrder("none")
    setDateRange({ from: undefined, to: undefined })
  }

  // Pagination handlers
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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of the middle section
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
        pageNumbers.push("ellipsis-start")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-end")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Loading state
  if (sessionStatus === "loading" || !session) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] animate-ping rounded-full bg-[#22c984]/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-10 w-10 text-[#22c984]" />
            </div>
          </div>
          <p className="text-lg font-medium text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  // If user is not an admin, don't render the page
  if (session && (session.user as any).role !== Role.ADMIN) {
    return null
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Role Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage user roles and permissions in the system</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Order */}
        <div>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>
                  {sortOrder === "newest"
                    ? "Newest First"
                    : sortOrder === "oldest"
                      ? "Oldest First"
                      : "Sort by Join Date"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sorting</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Picker */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Filter by Join Date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Date Range</h3>
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  // Validate the date range
                  if (range?.from && range?.to && range.from > range.to) {
                    // If from date is after to date, show a toast error
                    toast({
                      title: "Invalid Date Range",
                      description: "The start date must be before or equal to the end date.",
                      variant: "destructive",
                    })
                    return // Don't update the state with invalid range
                  }

                  // Update with valid range
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters */}
      {(sortOrder !== "none" || dateRange.from || dateRange.to) && (
        <div className="flex items-center mb-4 p-2 bg-muted rounded-md">
          <div className="flex-1">
            <span className="text-sm font-medium mr-2">Active Filters:</span>
            {sortOrder !== "none" && (
              <Badge variant="outline" className="mr-2">
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Badge>
            )}
            {dateRange.from && (
              <Badge variant="outline" className="mr-2">
                {dateRange.to
                  ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                  : `From ${format(dateRange.from, "LLL dd, y")}`}
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
          <TabsTrigger value="all">All Roles</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <LoadingState />
          ) : filteredAndSortedUsers.length === 0 ? (
            <EmptyState query={searchQuery} hasFilters={sortOrder !== "none" || !!dateRange.from} />
          ) : (
            <>
              <UserRolesGrid
                users={paginatedUsers}
                onChangeRole={handleChangeRole}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusIcon={getStatusIcon}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                  getPageNumbers={getPageNumbers}
                  totalItems={filteredAndSortedUsers.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="admin">
          {loading ? (
            <LoadingState />
          ) : filteredAndSortedUsers.length === 0 ? (
            <EmptyState query={searchQuery} hasFilters={sortOrder !== "none" || !!dateRange.from} />
          ) : (
            <>
              <UserRolesGrid
                users={paginatedUsers}
                onChangeRole={handleChangeRole}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusIcon={getStatusIcon}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                  getPageNumbers={getPageNumbers}
                  totalItems={filteredAndSortedUsers.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="support">
          {loading ? (
            <LoadingState />
          ) : filteredAndSortedUsers.length === 0 ? (
            <EmptyState query={searchQuery} hasFilters={sortOrder !== "none" || !!dateRange.from} />
          ) : (
            <>
              <UserRolesGrid
                users={paginatedUsers}
                onChangeRole={handleChangeRole}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusIcon={getStatusIcon}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                  getPageNumbers={getPageNumbers}
                  totalItems={filteredAndSortedUsers.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="client">
          {loading ? (
            <LoadingState />
          ) : filteredAndSortedUsers.length === 0 ? (
            <EmptyState query={searchQuery} hasFilters={sortOrder !== "none" || !!dateRange.from} />
          ) : (
            <>
              <UserRolesGrid
                users={paginatedUsers}
                onChangeRole={handleChangeRole}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusIcon={getStatusIcon}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  goToPreviousPage={goToPreviousPage}
                  goToNextPage={goToNextPage}
                  getPageNumbers={getPageNumbers}
                  totalItems={filteredAndSortedUsers.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Change Role Dialog */}
      {selectedUser && (
        <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>Update the role for {selectedUser.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  {selectedUser.profileImage ? (
                    <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <Label htmlFor="newRole" className="mb-2 block">
                Select New Role
              </Label>
              <Select value={newRole} onValueChange={setNewRole as any}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.SUPPORT}>Support</SelectItem>
                  <SelectItem value={Role.CLIENT}>Client</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Role Description</h4>
                <p className="text-sm text-muted-foreground">
                  {newRole === Role.ADMIN
                    ? "Administrators have full access to all features and settings in the system."
                    : newRole === Role.SUPPORT
                      ? "Support agents can help users with issues but have limited administrative access."
                      : "Clients have basic access to the platform features."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmChangeRole}
                disabled={processingAction || newRole === selectedUser.role}
                className="bg-[#22c984] hover:bg-[#1ba36d]"
              >
                {processingAction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Loading State Component
function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Empty State Component
function EmptyState({ query, hasFilters }: { query: string; hasFilters: boolean }) {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <User className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No users found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {query && !hasFilters
            ? `No users match your search for "${query}". Try a different search term.`
            : hasFilters && !query
              ? "No users match your current filters. Try adjusting your filter criteria."
              : query && hasFilters
                ? "No users match your search and filter criteria. Try adjusting your search or filters."
                : "No users found in this category."}
        </p>
      </div>
    </Card>
  )
}

// User Roles Grid Component
function UserRolesGrid({
  users,
  onChangeRole,
  getRoleBadgeColor,
  getStatusIcon,
}: {
  users: UserData[]
  onChangeRole: (user: UserData) => void
  getRoleBadgeColor: (role: Role) => string
  getStatusIcon: (status: string) => React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  {user.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.name} />
                  ) : (
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>
                )}
              </div>
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{user.company || "Not specified"}</span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(user.status)}
                  <span className="text-xs ml-1">{user.status}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {user.joinDate}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="font-medium">Current Role</span>
                </div>
                <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => onChangeRole(user)} className="bg-[#22c984] hover:bg-[#1ba36d]">
                Change Role
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  goToPage,
  goToPreviousPage,
  goToNextPage,
  getPageNumbers,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  goToPreviousPage: () => void
  goToNextPage: () => void
  getPageNumbers: () => (number | string)[]
  totalItems: number
  itemsPerPage: number
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
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
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <Button key={`ellipsis-${index}`} variant="outline" size="icon" disabled className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More pages</span>
              </Button>
            )
          }
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => goToPage(page as number)}
              className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
            >
              {page}
              <span className="sr-only">Page {page}</span>
            </Button>
          )
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
  )
}

