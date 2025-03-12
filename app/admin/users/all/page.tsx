"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Building,
  Calendar,
  User,
  FileText,
  Key,
  UserCog,
  AlertTriangle,
  Trash2,
  Edit,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
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
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Role } from "@prisma/client" // Add this import
import ErrorState from "./error-state"

// Define types for our data
interface UserDocument {
  name: string
  status: "Verified" | "Pending" | "Rejected"
  date: string
}

// Define the UserActivity interface
interface UserActivity {
  action: string
  date: string
  details: string
}

// Update the UserData interface to match your schema
interface UserData {
  id: string
  name: string
  email: string
  company: string
  role: Role
  status: "Active" | "Pending" | "Inactive" | "Suspended"
  joinDate: string
  lastActive: string
  emailVerified?: boolean
  documents?: UserDocument[]
  activity?: UserActivity[]
  profileImage?: string
  phone: string
  address: string
  businessId?: string
  // Update subscription related fields to match your schema
  subscriptionPlan?: string
  subscriptionStatus?: string
  notes?: string
  createdAt?: string
  nextBillingDate?: string
  subscriptionAmount?: number
  lastPasswordChange?: string
}

export default function AllUsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRole, setSelectedRole] = useState("All Roles")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
  })
  const [newRole, setNewRole] = useState<Role | "">("")
  const [processingAction, setProcessingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // First, add a state for the new user form data
  // Add this near the other state declarations:

  const [newUserData, setNewUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    role: Role.CLIENT,
    sendInvite: true,
    notes: "",
  })

  // Modify the fetchUsers function to try the test endpoint if the main one fails

  const fetchUsers = async () => {
    if (sessionStatus !== "authenticated") return

    try {
      setLoading(true)
      setError(null) // Clear any previous errors

      console.log("Fetching users from API")

      // Try the main API endpoint with the correct path
      let response = await fetch("/api/admin/users", {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      // If the main endpoint fails, try the test endpoint
      if (!response.ok) {
        console.log("Main API failed, trying test endpoint")
        response = await fetch("/api/users-test", {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        })
      }

      console.log("Response status:", response.status)

      // Check if response is OK
      if (!response.ok) {
        // Try to parse error as JSON
        let errorMessage = "Failed to fetch users"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If parsing fails, get the text content
          console.error("Failed to parse error response as JSON")
          errorMessage = "Server returned an error"
        }

        throw new Error(errorMessage)
      }

      // Clone the response before reading it
      const responseClone = response.clone()

      // Try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)

        // If JSON parsing fails, try to get the text content from the cloned response
        const textContent = await responseClone.text()
        console.error("Non-JSON response:", textContent.substring(0, 200))
        throw new Error("Invalid JSON response from server")
      }

      if (!data.users || !Array.isArray(data.users)) {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response format from server")
      }

      console.log(`Received ${data.users.length} users`)

      // Format the user data for display
      const formattedUsers = data.users.map((user: any) => ({
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        company: user.company || "Not specified",
        role: user.role || Role.CLIENT,
        status: user.status || "Active",
        emailVerified: user.emailVerified ?? true, // Default to true if not specified
        joinDate:
          user.joinDate ||
          (user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Unknown"),
        lastActive: user.lastActive
          ? new Date(user.lastActive).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never",
        phone: user.phone || "Not provided",
        address: user.address || "Not provided",
        profileImage: user.profileImage || null,
      }))

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
      router.push("/login?callbackUrl=/admin/users/all")
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

  // Replace your existing useEffect with this:
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchUsers()
    }
  }, [sessionStatus, session])

  // Filter users based on search query, tab, and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTab =
      (activeTab === "active" && user.status === "Active") ||
      (activeTab === "pending" && (user.status === "Pending" || user.emailVerified === false)) ||
      (activeTab === "inactive" && (user.status === "Inactive" || user.status === "Suspended")) ||
      activeTab === "all"

    const matchesRole = selectedRole === "All Roles" || user.role === selectedRole

    return matchesSearch && matchesTab && matchesRole
  })

  // Update the fetchUserDetails function to fetch more user data
  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true)

      // Use the correct API endpoint to fetch user details
      const response = await fetch(`/api/admin/users/${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch user details")
      }

      const data = await response.json()

      // Get business and subscription data if available
      let subscriptionData = {
        planName: "None",
        status: "Inactive",
        price: 0,
        nextBillingDate: null,
      }

      // If user has a business, try to get business data using your existing API
      if (data.user.businessId) {
        try {
          const businessResponse = await fetch(`/api/admin/businesses/${data.user.businessId}`)
          if (businessResponse.ok) {
            const businessData = await businessResponse.json()

            // If business has subscriptions, use the first active one
            if (businessData.subscriptions?.length > 0) {
              const activeSubscription =
                businessData.subscriptions.find((sub: any) => sub.status === "active") || businessData.subscriptions[0]

              subscriptionData = {
                planName: activeSubscription.planName || "None",
                status: activeSubscription.status || "Inactive",
                price: activeSubscription.price || 0,
                nextBillingDate: activeSubscription.nextBillingDate || null,
              }
            }
          }
        } catch (businessError) {
          console.error("Error fetching business data:", businessError)
          // Continue with default subscription data
        }
      }

      // Get user activity if available
      let userActivity = []
      try {
        const activityResponse = await fetch(`/api/admin/users/${userId}/activity`)
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          userActivity = activityData.activities || []
        }
      } catch (activityError) {
        console.error("Error fetching user activity:", activityError)
        // Continue with empty activity array
      }

      // Format the user data for display
      const userDetails: UserData = {
        id: data.user.id,
        name: data.user.name || "Unknown",
        email: data.user.email,
        company: data.user.business?.name || "Not specified",
        role: data.user.role || Role.CLIENT,
        status: data.user.status || "Active",
        joinDate: new Date(data.user.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        lastActive: data.user.lastActive
          ? new Date(data.user.lastActive).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never",
        phone: data.user.business?.phone || "Not provided",
        address: data.user.business?.address || "Not provided",
        profileImage: data.user.image || null,
        notes: data.user.notes || "",
        businessId: data.user.businessId || null,
        subscriptionPlan: subscriptionData.planName,
        subscriptionStatus: subscriptionData.status,
        subscriptionAmount: subscriptionData.price,
        nextBillingDate: subscriptionData.nextBillingDate
          ? new Date(subscriptionData.nextBillingDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A",
        lastPasswordChange: data.user.lastPasswordChange
          ? new Date(data.user.lastPasswordChange).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Never",
        // Add placeholder data for documents and activity if not available
        documents: data.user.business?.documents || [],
        activity: userActivity.length > 0 ? userActivity : [],
      }

      setSelectedUser(userDetails)
      setFormData({
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        company: userDetails.company,
        address: userDetails.address,
        notes: userDetails.notes || "",
      })
      setNewRole(userDetails.role)
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const viewUserDetails = async (user: UserData) => {
    await fetchUserDetails(user.id)
    setShowUserDialog(true)
  }

  const handleEditUser = async (user: UserData) => {
    await fetchUserDetails(user.id)
    setShowEditUserDialog(true)
  }

  const handleResetPassword = (user: UserData) => {
    setSelectedUser(user)
    setShowResetPasswordDialog(true)
  }

  // Update the confirmChangeRole function to use the correct API path

  const confirmChangeRole = async () => {
    if (!selectedUser || !newRole) return

    setProcessingAction(true)

    try {
      // Use the correct API endpoint to change a user's role
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

  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Then update the handleNewUserInputChange function
  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewUserData((prev) => ({ ...prev, [name]: value }))
  }

  // Add a function to handle checkbox changes
  const handleNewUserCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNewUserData((prev) => ({ ...prev, [name]: checked }))
  }

  // Add a function to handle select changes
  const handleNewUserSelectChange = (name: string, value: string) => {
    setNewUserData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the confirmDeleteUser function to use the correct API path

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    setProcessingAction(true)

    try {
      // Use the correct API endpoint to delete a user
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      // Remove user from the list
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id))
      setShowDeleteDialog(false)

      toast({
        title: "User Deleted",
        description: `${selectedUser.name} has been deleted successfully.`,
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Update the confirmResetPassword function to use the correct API path

  const confirmResetPassword = async () => {
    if (!selectedUser) return

    setProcessingAction(true)

    try {
      // Use the correct API endpoint to reset a user's password
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      setShowResetPasswordDialog(false)

      toast({
        title: "Password Reset",
        description: `Password reset email has been sent to ${selectedUser.email}.`,
      })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Update the toggleUserStatus function to use the correct API path

  const toggleUserStatus = async (user: UserData) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active"

    try {
      // Use the correct API endpoint to update a user's status
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user status")
      }

      // Update user in the list
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === user.id ? { ...u, status: newStatus as any } : u)))

      toast({
        title: `User ${newStatus}`,
        description: `${user.name} has been ${newStatus.toLowerCase()}.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the handleSaveUser function to use the correct API path

  const handleSaveUser = async () => {
    if (!selectedUser) return

    setProcessingAction(true)

    try {
      // Use the correct API endpoint to update a user
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      // Update user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                address: formData.address,
              }
            : user,
        ),
      )

      setShowEditUserDialog(false)

      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s information has been updated.`,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Add a function to create a new user
  const createUser = async () => {
    setProcessingAction(true)

    try {
      // Use the API endpoint to create a new user
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${newUserData.firstName} ${newUserData.lastName}`.trim(),
          email: newUserData.email,
          password: newUserData.password,
          phone: newUserData.phone,
          company: newUserData.company,
          role: newUserData.role,
          notes: newUserData.notes,
          sendInvite: newUserData.sendInvite,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      // Refresh the user list
      fetchUsers()

      setShowAddUserDialog(false)

      // Reset the form
      setNewUserData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        company: "",
        role: Role.CLIENT,
        sendInvite: true,
        notes: "",
      })

      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Get available roles from your system
  const roles = ["All Roles", Role.ADMIN, Role.SUPPORT, Role.CLIENT]

  // Function to export user data as CSV
  const exportUserData = () => {
    // Define the headers for the CSV file
    const headers = ["ID", "Name", "Email", "Company", "Role", "Status", "Join Date", "Last Active", "Phone", "Address"]

    // Convert user data to CSV format
    const userDataCSV = filteredUsers.map((user) => [
      user.id,
      user.name,
      user.email,
      user.company,
      user.role,
      user.status,
      user.joinDate,
      user.lastActive,
      user.phone,
      user.address,
    ])

    // Combine headers and data
    const csvContent = [headers.join(","), ...userDataCSV.map((row) => row.join(","))].join("\n")

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link and trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `user-data-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleChangeRole = (user: UserData) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowChangeRoleDialog(true)
  }

  // If session is loading or user is not authenticated, show loading state
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

  if (error) {
    return <ErrorState error={error} onRetry={fetchUsers} />
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
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all users in the system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportUserData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddUserDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserTable
            users={filteredUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="active">
          <UserTable
            users={filteredUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="pending">
          <UserTable
            users={filteredUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="inactive">
          <UserTable
            users={filteredUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Detailed information about {selectedUser.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* User Profile */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                        {selectedUser.profileImage ? (
                          <Image
                            src={selectedUser.profileImage || "/placeholder.svg"}
                            alt={selectedUser.name}
                            width={96}
                            height={96}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-3xl text-gray-600 dark:text-gray-300 font-medium">
                            {selectedUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{selectedUser.email}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          selectedUser.role === Role.ADMIN
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : selectedUser.role === Role.SUPPORT
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {selectedUser.role}
                      </span>

                      <div className="mt-6 w-full">
                        <div className="flex items-center text-sm mb-2">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.phone || "Not provided"}
                        </div>
                        <div className="flex items-start text-sm mb-2">
                          <Building className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                          <span>{selectedUser.address || "Not provided"}</span>
                        </div>
                        <div className="flex items-center text-sm mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Joined {selectedUser.joinDate}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:w-2/3 space-y-6">
                  {/* Subscription Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Subscription</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="font-medium">{selectedUser.subscriptionPlan || "None"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                            selectedUser.subscriptionStatus === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : selectedUser.subscriptionStatus === "Trial"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {selectedUser.subscriptionStatus === "Active" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : selectedUser.subscriptionStatus === "Trial" ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {selectedUser.subscriptionStatus || "Inactive"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Next Billing</p>
                        <p className="font-medium">{selectedUser.nextBillingDate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-medium">
                          {selectedUser.subscriptionAmount ? `$${selectedUser.subscriptionAmount}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Security Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Last Password Change</span>
                        </div>
                        <span>{selectedUser.lastPasswordChange || "Never"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Login Sessions</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Documents and Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documents */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Documents</h3>
                  </div>
                  <div className="p-4">
                    {selectedUser.documents && selectedUser.documents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500">{doc.date}</p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                doc.status === "Verified"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : doc.status === "Pending"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No documents found</p>
                    )}
                  </div>
                </Card>

                {/* Activity */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Recent Activity</h3>
                  </div>
                  <div className="p-4">
                    {selectedUser.activity && selectedUser.activity.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.activity.map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                              <Clock className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.action}</p>
                              <p className="text-xs text-gray-500">{activity.date}</p>
                              <p className="text-xs text-gray-500">{activity.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No activity found</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Notes */}
              {selectedUser.notes && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.notes}</p>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDialog(false)
                  handleEditUser(selectedUser)
                }}
              >
                Edit User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={newUserData.firstName}
                  onChange={handleNewUserInputChange}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={newUserData.lastName}
                  onChange={handleNewUserInputChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newUserData.email}
                onChange={handleNewUserInputChange}
                placeholder="Email address"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={newUserData.password}
                onChange={handleNewUserInputChange}
                placeholder="Password"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={newUserData.phone}
                onChange={handleNewUserInputChange}
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={newUserData.company}
                onChange={handleNewUserInputChange}
                placeholder="Company name"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUserData.role} onValueChange={(value) => handleNewUserSelectChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r !== "All Roles")
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={newUserData.notes}
                onChange={handleNewUserInputChange}
                placeholder="Additional notes about this user"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendInvite"
                name="sendInvite"
                checked={newUserData.sendInvite}
                onChange={handleNewUserCheckboxChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="sendInvite">Send welcome email with login instructions</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={createUser} disabled={processingAction}>
              {processingAction ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update information for {selectedUser.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" value={formData.company} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={processingAction}>
                {processingAction ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Dialog */}
      {selectedUser && (
        <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset the password for {selectedUser.name}? A password reset link will be sent
                to their email address.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetPassword} disabled={processingAction}>
                {processingAction ? "Processing..." : "Reset Password"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Change Role Dialog */}
      {selectedUser && (
        <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>Update the role for {selectedUser.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newRole" className="mb-2 block">
                Select New Role
              </Label>
              <Select value={newRole} onValueChange={setNewRole as any}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r !== "All Roles")
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmChangeRole} disabled={processingAction}>
                {processingAction ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {selectedUser && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedUser.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
                disabled={processingAction}
              >
                {processingAction ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

// User Table Component
function UserTable({
  users,
  onViewUser,
  onEditUser,
  onResetPassword,
  onChangeRole,
  onToggleStatus,
  onDeleteUser,
  loading,
}: {
  users: UserData[]
  onViewUser: (user: UserData) => void
  onEditUser: (user: UserData) => void
  onResetPassword: (user: UserData) => void
  onChangeRole: (user: UserData) => void
  onToggleStatus: (user: UserData) => void
  onDeleteUser: (user: UserData) => void
  loading: boolean
}) {
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

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <User className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No users match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-sm">User</th>
              <th className="text-left p-4 font-medium text-sm">Role</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Company</th>
              <th className="text-left p-4 font-medium text-sm">Join Date</th>
              <th className="text-left p-4 font-medium text-sm">Last Active</th>
              <th className="text-left p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage || "/placeholder.svg"}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.role === Role.ADMIN
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : user.role === Role.SUPPORT
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : user.status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.status === "Active" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : user.status === "Pending" ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {user.status}
                  </span>
                </td>
                <td className="p-4">{user.company}</td>
                <td className="p-4">{user.joinDate}</td>
                <td className="p-4">{user.lastActive}</td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewUser(user)}>
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeRole(user)}>
                          <UserCog className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(user)}
                            className="text-amber-600 dark:text-amber-400"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : user.status === "Inactive" || user.status === "Suspended" ? (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(user)}
                            className="text-green-600 dark:text-green-400"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => onDeleteUser(user)} className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

