"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Eye, Copy } from "lucide-react"
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
import { useRouter } from "next/navigation"
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
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [activeTab, setActiveTab] = useState("all")
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

  // Fetch pending users
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchPendingUsers()
    } else if (sessionStatus === "authenticated" && (session?.user as any)?.role !== Role.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [sessionStatus, session, router, toast])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      // Fetch all users regardless of status to populate all tabs
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setPendingUsers(data.users)
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
      const response = await fetch(`/api/admin/users/${userId}/business`)

      if (response.ok) {
        const data = await response.json()
        if (data.business) {
          return {
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
      const businessData = await fetchUserBusinessData(user.id)
      if (businessData) {
        setBusinessFormData(businessData)
        setSelectedUser(user)
        setShowUserDialog(true)
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

      // Update the user in the list
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

  // Filter users based on search query and tab
  const filteredUsers = pendingUsers.filter((user) => {
    // First filter by search query
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.business?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Then filter by tab (service status)
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && user.business?.serviceStatus === "Pending") ||
      (activeTab === "approved" && user.business?.serviceStatus === "Approved")

    return matchesSearch && matchesTab
  })

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

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">LLC Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage business information and LLC status</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending LLC ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved LLC ({approvedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserList users={filteredUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
        </TabsContent>

        <TabsContent value="pending">
          <UserList users={filteredUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
        </TabsContent>

        <TabsContent value="approved">
          <UserList users={filteredUsers} onViewDetails={viewUserDetails} copyToClipboard={copyToClipboard} />
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
        <Card key={user.id} className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-1">
                <p className="font-medium">{user.name}</p>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center mt-1">
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

