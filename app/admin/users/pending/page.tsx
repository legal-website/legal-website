"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  RefreshCw,
  AlertCircle,
  EyeOff,
  Lock,
  Building,
  Calendar,
  FileText,
  MessageSquare,
  ThumbsUp,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  ToggleLeft,
  Trash,
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Role } from "@prisma/client"
import { isAfter, parseISO } from "date-fns"

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
    annualReportFee?: number
    annualReportFrequency?: number
    completedAt?: string | null
  }
  phoneRequest?: PhoneNumberRequest
  accountManagerRequest?: AccountManagerRequest
  address?: UserAddress
  role?: Role
  subscriptionPlan?: string
  subscriptionStatus?: string
  nextBillingDate?: string
  subscriptionAmount?: number
  invoices?: any[]
  profileImage?: string
  isOnline?: boolean
  lastPasswordChange?: string
  passwordResetCount?: number
  activity?: any[]
  phone?: string
  joinDate?: string
}

// Add this CSS class for extra small screens
const globalStyles = `
  @media (min-width: 400px) {
    .xs\\:inline {
      display: inline;
    }
    .xs\\:hidden {
      display: none;
    }
  }
`

interface PhoneNumberRequest {
  id?: string
  status: "requested" | "pending" | "approved" | "rejected"
  phoneNumber?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

interface AccountManagerRequest {
  id?: string
  status: "requested" | "pending" | "approved" | "rejected"
  managerName?: string
  contactLink?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

// Add this interface for user address
interface UserAddress {
  id?: string
  userId: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  createdAt?: string
  updatedAt?: string
}

interface ComplianceItem {
  id: string
  name: string
  description: string
  category: string
  status: "pending" | "verified" | "rejected"
  dueDate: string
  priority: "high" | "medium" | "low"
  userId: string
  createdAt: string
  updatedAt: string
}

interface ComplianceTrendPoint {
  date: string
  total: number
  pending: number
  verified: number
  rejected: number
}

interface ComplianceCategoryData {
  category: string
  total: number
  pending: number
  verified: number
  rejected: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: "paid" | "pending" | "overdue"
  createdAt: string
  updatedAt: string
}

export default function AdminBeneficialOwnershipPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [showAccountManagerDialog, setShowAccountManagerDialog] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false) // New state for address dialog
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)
  const [loadingRevenue, setLoadingRevenue] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRole, setSelectedRole] = useState<Role | "All Roles">("All Roles")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userAddress, setUserAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })
  const [userDocuments, setUserDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [roles, setRoles] = useState<Role[]>(["ADMIN", "SUPPORT", "CLIENT"])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  })
  const [newUserData, setNewUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    role: "CLIENT",
    notes: "",
    sendInvite: true,
  })
  const [businessFormData, setBusinessFormData] = useState({
    name: "",
    businessId: "",
    ein: "",
    formationDate: new Date().toISOString().split("T")[0],
    serviceStatus: "Pending",
    llcStatusMessage: "LLC formation initiated",
    llcProgress: 10,
    annualReportFee: 100,
    annualReportFrequency: 1,
    completedAt: null as string | null,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "pending" | "reported" | "none">("newest")
  const [dateFilter, setDateFilter] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: "",
    endDate: "",
  })
  // Add loading state for address
  const [addressLoading, setAddressLoading] = useState(false)

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Formation",
    file: null as File | null,
    userId: "",
    isPermanent: false,
  })

  const [newRole, setNewRole] = useState<Role | "">("")
  const [processingAction, setProcessingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add these new state variables after the existing state declarations
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([])
  const [totalCompliance, setTotalCompliance] = useState(0)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [complianceSolved, setComplianceSolved] = useState(0)
  const [complianceTrendData, setComplianceTrendData] = useState<ComplianceTrendPoint[]>([])
  const [complianceCategoryData, setComplianceCategoryData] = useState<ComplianceCategoryData[]>([])
  const [loadingCompliance, setLoadingCompliance] = useState(true)
  const [complianceAlert, setComplianceAlert] = useState(false)

  // Add these new state variables after the existing state declarations
  const [revenueOverviewData, setRevenueOverviewData] = useState<
    { month: string; revenue: number; monthlyRevenue: number; growth: number }[]
  >([])
  const [userGrowthOverviewData, setUserGrowthOverviewData] = useState<
    { month: string; totalUsers: number; newUsers: number; growth: number }[]
  >([])
  const [loadingRevenueOverview, setLoadingRevenueOverview] = useState(true)
  const [loadingUserGrowthOverview, setLoadingUserGrowthOverview] = useState(true)

  // Function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return date.toLocaleDateString(undefined, options)
  }

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Function to get formatted role
  const getFormattedRole = () => {
    if (selectedUser) {
      switch (selectedUser.role) {
        case Role.ADMIN:
          return "Admin"
        case Role.SUPPORT:
          return "Support"
        case Role.CLIENT:
          return "Client"
        default:
          return "Unknown"
      }
    }
    return "Unknown"
  }

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Function to handle new user input change
  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value })
  }

  // Function to handle new user select change
  const handleNewUserSelectChange = (name: string, value: string) => {
    setNewUserData({ ...newUserData, [name]: value })
  }

  // Function to handle new user checkbox change
  const handleNewUserCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.checked })
  }

  // Function to handle save user
  const handleSaveUser = async () => {
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setShowEditUserDialog(false)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Function to handle create user
  const createUser = async () => {
    setProcessingAction(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        })
        setShowAddUserDialog(false)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Function to handle edit user
  const handleEditUser = (user: PendingUser) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      company: user.business?.name || "",
      address: userAddress.address || "",
      city: userAddress.city || "",
      state: userAddress.state || "",
      zip: userAddress.zipCode || "",
      country: userAddress.country || "",
    })
    setShowEditUserDialog(true)
  }

  // Function to handle reset password
  const handleResetPassword = (user: PendingUser) => {
    setSelectedUser(user)
    setShowResetPasswordDialog(true)
  }

  // Function to handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    setPasswordError(null)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser?.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset successfully",
        })
        setShowResetPasswordDialog(false)
        setPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Error",
          description: "Failed to reset password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle change role
  const handleChangeRole = async (user: PendingUser, role: Role) => {
    setSelectedUser(user)
    setNewRole(role)
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/change-role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Function to handle toggle user status
  const toggleUserStatus = async (user: PendingUser) => {
    setSelectedUser(user)
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User status updated successfully",
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Function to handle delete user
  const handleDeleteUser = async (user: PendingUser) => {
    setSelectedUser(user)
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Function to get date range
  const getDateRange = useCallback(() => {
    const today = new Date()
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)

    const previousEndDate = new Date(today.getFullYear(), today.getMonth() - 1, 0)
    const previousStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    return {
      startDate,
      previousStartDate,
      endDate,
      previousEndDate,
    }
  }, [])

  // Function to filter users based on search query and selected role
  const filteredUsers = pendingUsers.filter((user) => {
    const searchRegex = new RegExp(searchQuery, "i")
    const nameMatch = searchRegex.test(user.name)
    const emailMatch = searchRegex.test(user.email)
    const roleMatch = selectedRole === "All Roles" || user.role === selectedRole

    return (nameMatch || emailMatch) && roleMatch
  })

  // Function to paginate users
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Function to calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Function to go to next page
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  // Function to go to previous page
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // Function to go to a specific page
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Fetch invoices data
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/invoices")

      if (!response.ok) {
        throw new Error("Failed to fetch invoices")
      }

      const data = await response.json()
      const invoices: Invoice[] = data.invoices || []

      // Calculate metrics based on date range
      const { startDate, previousStartDate, endDate, previousEndDate } = getDateRange()

      // Current period revenue (only count paid invoices)
      const currentRevenue = invoices
        .filter(
          (invoice) =>
            invoice.status === "paid" &&
            isAfter(parseISO(invoice.createdAt), startDate) &&
            !isAfter(parseISO(invoice.createdAt), endDate),
        )
        .reduce((sum, invoice) => sum + invoice.amount, 0)

      // Previous period revenue
      const previousRevenue = invoices
        .filter(
          (invoice) =>
            invoice.status === "paid" &&
            isAfter(parseISO(invoice.createdAt), previousStartDate) &&
            !isAfter(parseISO(invoice.createdAt), previousEndDate),
        )
        .reduce((sum, invoice) => sum + invoice.amount, 0)

      // Calculate percentage change
      const change =
        previousRevenue === 0
          ? currentRevenue > 0
            ? 100
            : 0
          : ((currentRevenue - previousRevenue) / previousRevenue) * 100

      setTotalRevenue(currentRevenue)
      setRevenueChange(change)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getDateRange, toast])

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()

      // Process the users to extract business data
      const processedUsers = await Promise.all(
        data.users.map(async (user: any) => {
          // Fetch business data for each user
          const businessData = await fetchUserBusinessData(user.id)
          // Fetch phone request data for each user
          const phoneRequestData = await fetchUserPhoneRequest(user.id)
          // Fetch account manager request data for each user
          const accountManagerRequestData = await fetchUserAccountManagerRequest(user.id)
          // Fetch address data for each user
          const addressData = await fetchUserAddress(user.id)

          return {
            id: user.id,
            name: user.name || "Unknown",
            email: user.email || "",
            business: businessData || undefined,
            phoneRequest: phoneRequestData || undefined,
            accountManagerRequest: accountManagerRequestData || undefined,
            address: addressData || undefined,
            role: user.role || "CLIENT",
            subscriptionPlan: user.subscriptionPlan || "None",
            subscriptionStatus: user.subscriptionStatus || "Inactive",
            nextBillingDate: user.nextBillingDate || "N/A",
            subscriptionAmount: user.subscriptionAmount || 0,
            invoices: user.invoices || [],
            profileImage: user.profileImage || "/placeholder.svg",
            isOnline: user.isOnline || false,
            lastPasswordChange: user.lastPasswordChange || "Never",
            passwordResetCount: user.passwordResetCount || 0,
            activity: user.activity || [],
            phone: user.phone || "Not provided",
            joinDate: user.createdAt || "N/A",
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
      setLoadingUsers(false)
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
            annualReportFee: data.business.annualReportFee || 100,
            annualReportFrequency: data.business.annualReportFrequency || 1,
            completedAt: data.business.completedAt,
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
        annualReportFee: 100,
        annualReportFrequency: 1,
        completedAt: null,
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
      return null
    }
  }

  const fetchUserPhoneRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/phone-request`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.request) {
          return data.request
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching phone request data:", error)
      return null
    }
  }

  // Add this function to fetch account manager request
  const fetchUserAccountManagerRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/account-manager`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.request) {
          return data.request
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching account manager request data:", error)
      return null
    }
  }

  // Add this function to fetch user address data
  const fetchUserAddress = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/address`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.address) {
          return data.address
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching user address data:", error)
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
          annualReportFee: user.business.annualReportFee || 100,
          annualReportFrequency: user.business.annualReportFrequency || 1,
          completedAt: user.business.completedAt || null,
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
            annualReportFee: businessData.annualReportFee || 100,
            annualReportFrequency: businessData.annualReportFrequency || 1,
            completedAt: businessData.completedAt || null,
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

  // Add this function to handle opening the address dialog
  const handleOpenAddressDialog = (user: PendingUser) => {
    setSelectedUser(user)
    setShowAddressDialog(true)
  }

  const UserTable = ({
    users,
    onViewUser,
    onEditUser,
    onResetPassword,
    onChangeRole,
    onToggleStatus,
    onDeleteUser,
    loading,
    formatDate,
    getStatusColor,
  }: {
    users: PendingUser[]
    onViewUser: (user: PendingUser) => void
    onEditUser: (user: PendingUser) => void
    onResetPassword: (user: PendingUser) => void
    onChangeRole: (user: PendingUser, role: Role) => void
    onToggleStatus: (user: PendingUser) => void
    onDeleteUser: (user: PendingUser) => void
    loading: boolean
    formatDate: (dateString: string) => string
    getStatusColor: (status: string) => string
  }) => {
    return (
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                Role
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Last Seen
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {user.name}
                  </th>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <Select value={user.role || "CLIENT"} onValueChange={(value) => onChangeRole(user, value as Role)}>
                      <SelectTrigger className="w-[180px]">
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
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 font-semibold rounded-full ${getStatusColor(user.subscriptionStatus || "inactive")}`}
                    >
                      {user.subscriptionStatus || "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{user.isOnline ? "Online" : "Offline"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => onViewUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onResetPassword(user)}>
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onToggleStatus(user)}>
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => onDeleteUser(user)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto mb-20 md:mb-40">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Manage all users in the system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={fetchUsers} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Roles">All Roles</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              <SelectItem value={Role.SUPPORT}>Support</SelectItem>
              <SelectItem value={Role.CLIENT}>Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="validationEmailSent">Validation Email Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserTable
            users={paginatedUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            formatDate={formatDate}
            getStatusColor={getStatusBadgeClass}
          />
          {/* Add Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center gap-1 order-1 sm:order-2 mb-2 sm:mb-0">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                  >
                    {page}
                    <span className="sr-only">Page {page}</span>
                  </Button>
                ))}
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

        <TabsContent value="active">
          <UserTable
            users={paginatedUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            formatDate={formatDate}
            getStatusColor={getStatusBadgeClass}
          />
          {/* Add Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                  >
                    {page}
                    <span className="sr-only">Page {page}</span>
                  </Button>
                ))}
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
          <UserTable
            users={paginatedUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            formatDate={formatDate}
            getStatusColor={getStatusBadgeClass}
          />
          {/* Add Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                  >
                    {page}
                    <span className="sr-only">Page {page}</span>
                  </Button>
                ))}
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

        <TabsContent value="inactive">
          <UserTable
            users={paginatedUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            formatDate={formatDate}
            getStatusColor={getStatusBadgeClass}
          />
          {/* Add Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                  >
                    {page}
                    <span className="sr-only">Page {page}</span>
                  </Button>
                ))}
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

        <TabsContent value="validationEmailSent">
          <UserTable
            users={paginatedUsers}
            onViewUser={viewUserDetails}
            onEditUser={handleEditUser}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            formatDate={formatDate}
            getStatusColor={getStatusBadgeClass}
          />
          {/* Add Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 ${currentPage === page ? "bg-[#22c984] hover:bg-[#1ba36d]" : ""}`}
                  >
                    {page}
                    <span className="sr-only">Page {page}</span>
                  </Button>
                ))}
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

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
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
                              ? selectedUser.name.charAt(0).toUpperCase()
                              : selectedUser.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{selectedUser.email}</p>
                      {/* Update the role badge colors (around line 850) */}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          selectedUser.role === Role.ADMIN
                            ? "bg-[#22c984]/20 text-[#22c984] dark:bg-[#22c984]/30 dark:text-[#22c984]"
                            : selectedUser.role === Role.SUPPORT
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {getFormattedRole()}
                      </span>

                      <div className="mt-6 w-full">
                        <div className="flex items-center text-sm mb-2">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.phone || "Not provided"}
                        </div>
                        <div className="flex items-start text-sm mb-2">
                          <Building className="h-5 w-5 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-left">{userAddress.address || "Not provided"}</span>
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
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Subscription</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Items/Packages</p>
                        <p className="font-medium">{selectedUser.subscriptionPlan || "None"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                            selectedUser.subscriptionStatus === "paid" || selectedUser.subscriptionStatus === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : selectedUser.subscriptionStatus === "pending" ||
                                  selectedUser.subscriptionStatus === "Trial"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {selectedUser.subscriptionStatus === "paid" ||
                          selectedUser.subscriptionStatus === "Active" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : selectedUser.subscriptionStatus === "pending" ||
                            selectedUser.subscriptionStatus === "Trial" ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {selectedUser.subscriptionStatus === "paid"
                            ? "Paid"
                            : selectedUser.subscriptionStatus === "pending"
                              ? "Pending"
                              : selectedUser.subscriptionStatus || "Inactive"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Payment Date</p>
                        <p className="font-medium">{selectedUser.nextBillingDate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-medium">
                          {selectedUser.subscriptionAmount ? `$${selectedUser.subscriptionAmount.toFixed(2)}` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Add invoice history section */}
                    {selectedUser.invoices && selectedUser.invoices.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Invoice History</h4>
                        <div className="max-h-40 overflow-y-auto">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2">Invoice #</th>
                                  <th className="text-left py-2">Date</th>
                                  <th className="text-left py-2">Amount</th>
                                  <th className="text-left py-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedUser.invoices.map((invoice: any) => (
                                  <tr key={invoice.id} className="border-b">
                                    <td className="py-2">{invoice.invoiceNumber}</td>
                                    <td className="py-2">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                    <td className="py-2">${invoice.amount.toFixed(2)}</td>
                                    <td className="py-2">
                                      <span
                                        className={`px-1.5 py-0.5 text-xs rounded-full ${
                                          invoice.status === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : invoice.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {invoice.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Security Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Login Sessions</span>
                        </div>
                        <span>{selectedUser.isOnline ? "Online" : "Offline"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Last Password Change</span>
                        </div>
                        <span>{selectedUser.lastPasswordChange || "Never"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Password Reset Count</span>
                        </div>
                        <span>{selectedUser.passwordResetCount || 0}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Documents and Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Documents */}
              <Card>
                <div className="p-4 border-b">
                  <h3 className="font-medium">Recent Documents</h3>
                </div>
                <div className="p-4">
                  {loadingDocuments ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-6 w-6 border-2 border-[#22c984] border-t-transparent rounded-full"></div>
                    </div>
                  ) : userDocuments && userDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {userDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
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
                            {doc.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents found for this user</p>
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
                    <div className="space-y-4">
                      {selectedUser.activity.slice(0, 4).map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {activity.iconType === "post" ? (
                              <FileText className="h-4 w-4 text-blue-500" />
                            ) : activity.iconType === "comment" ? (
                              <MessageSquare className="h-4 w-4 text-green-500" />
                            ) : activity.iconType === "like" ? (
                              <ThumbsUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm">{activity.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
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
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {/* Change the Create User button color (around line 1000) */}
            <Button className="bg-[#22c984] hover:bg-[#1ba36d]" onClick={createUser} disabled={processingAction}>
              {processingAction ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input id="zip" name="zip" value={formData.zip} onChange={handleInputChange} />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-red-500 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words">{passwordError}</span>
                </div>
              )}
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
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {passwordError && <p className="text-sm text-red-600 mt-1">Passwords do not match</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

