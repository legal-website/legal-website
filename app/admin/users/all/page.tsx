"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Building,
  Calendar,
  User,
  FileText,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Shield,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
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
import { Role } from "@/lib/prisma-types" // Change this line to import from our types file
import ErrorState from "./error-state"
import { OnlineStatusTracker } from "@/components/online-status-tracker"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { db } from "@/lib/db"

// Define types for our data
interface UserDocument {
  name: string
  status: "Verified" | "Pending" | "Rejected"
  date: string
}

// Find the UserActivity interface and update it to include iconType
// Change this:
interface UserActivity {
  action: string
  date: string
  details: string
}

// To this:
interface UserActivity {
  action: string
  date: string
  details: string
  iconType?: "post" | "comment" | "like" | string
  type?: string
}

// Update the UserData interface to include passwordResetCount
interface UserData {
  id: string
  name: string
  email: string
  company: string
  role: Role
  status: "Active" | "Pending" | "Inactive" | "Suspended" | "Validation Email Sent"
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
  isOnline?: boolean
  invoices?: any[] // Add this line to store user invoices
  passwordResetCount?: number // Add this field to track password reset requests
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
  const [refreshing, setRefreshing] = useState(false)
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

  // First, add a new state for user documents
  // Add this near the other state declarations (around line 100-150)
  const [userDocuments, setUserDocuments] = useState<any[]>([])

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "pending" | "approved" | "none">("none")
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

  // Add a state to track if documents are loading
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Modify the fetchUsers function to try the test endpoint if the main one fails

  // Find the fetchUsers function and update it to include the last active time and reset count
  const fetchUsers = async () => {
    if (sessionStatus !== "authenticated") return

    try {
      setLoading(true)
      setRefreshing(true)
      setError(null) // Clear any previous errors

      console.log("Fetching users from API")

      // Try the main API endpoint with the correct path
      const response = await fetch("/api/admin/users", {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

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

      // Try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        throw new Error("Invalid JSON response from server")
      }

      if (!data.users || !Array.isArray(data.users)) {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response format from server")
      }

      console.log(`Received ${data.users.length} users`)

      // Get online users
      let onlineUserIds: string[] = []
      try {
        const onlineResponse = await fetch("/api/admin/users/online-status")
        if (onlineResponse.ok) {
          const onlineData = await onlineResponse.json()
          onlineUserIds = onlineData.onlineUsers || []
        }
      } catch (error) {
        console.error("Error fetching online users:", error)
      }

      // Format the user data for display
      const formattedUsers = await Promise.all(
        data.users.map(async (user: any) => {
          // Count password reset requests for this user
          let resetCount = 0
          try {
            resetCount = await db.verificationToken.count({
              where: {
                userId: user.id,
              },
            })
          } catch (error) {
            console.error(`Error counting reset requests for user ${user.id}:`, error)
          }

          // Get the most recent verification token for this user (for last password reset)
          let lastPasswordReset = null
          try {
            const latestToken = await db.verificationToken.findFirst({
              where: {
                userId: user.id,
              },
              orderBy: {
                expires: "desc",
              },
            })
            if (latestToken) {
              lastPasswordReset = latestToken.expires
            }
          } catch (error) {
            console.error(`Error finding latest token for user ${user.id}:`, error)
          }

          // Check if user is online
          const isOnline = onlineUserIds.includes(user.id)

          // Format the last active time - use updatedAt if available, otherwise use createdAt
          let lastActiveTime = "Offline"
          if (isOnline) {
            lastActiveTime = "Online now"
          }

          return {
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
            // Use the formatted lastActiveTime
            lastActive: lastActiveTime,
            phone: user.phone || "Not provided",
            address: user.address || "Not provided",
            profileImage: user.profileImage || null,
            isOnline: isOnline,
            passwordResetCount: resetCount,
            // Add lastPasswordChange field with actual date
            lastPasswordChange: lastPasswordReset
              ? new Date(lastPasswordReset).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Never",
          }
        }),
      )

      setUsers(formattedUsers)

      if (refreshing) {
        toast({
          title: "Refreshed",
          description: `Successfully refreshed user data.`,
        })
      }
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
      setRefreshing(false)
    }
  }

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true)
    fetchUsers()
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

      // Poll for updates every 30 seconds to refresh online status
      // but only when the user details dialog is not open
      const interval = setInterval(() => {
        if (!showUserDialog && !showEditUserDialog && !showAddUserDialog) {
          fetchUsers()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [sessionStatus, session, showUserDialog, showEditUserDialog, showAddUserDialog])

  // Replace the filteredUsers function with this enhanced version that includes sorting and date filtering
  // Replace the existing filteredUsers definition (around line 200)
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTab =
        (activeTab === "active" && user.status === "Active") ||
        (activeTab === "pending" && (user.status === "Pending" || user.emailVerified === false)) ||
        (activeTab === "inactive" && (user.status === "Inactive" || user.status === "Suspended")) ||
        (activeTab === "validationEmailSent" && user.status === "Validation Email Sent") ||
        activeTab === "all"

      const matchesRole = selectedRole === "All Roles" || user.role === selectedRole

      // Add date filtering
      let matchesDateFilter = true
      if (dateFilter.startDate) {
        const userJoinDate = new Date(user.joinDate)
        const filterStartDate = new Date(dateFilter.startDate)
        matchesDateFilter = userJoinDate >= filterStartDate
      }

      if (dateFilter.endDate && matchesDateFilter) {
        const userJoinDate = new Date(user.joinDate)
        const filterEndDate = new Date(dateFilter.endDate)
        // Set end date to end of day
        filterEndDate.setHours(23, 59, 59, 999)
        matchesDateFilter = userJoinDate <= filterEndDate
      }

      return matchesSearch && matchesTab && matchesRole && matchesDateFilter
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortOrder === "newest") {
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      } else if (sortOrder === "oldest") {
        return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
      } else if (sortOrder === "pending") {
        if (a.status === "Pending" && b.status !== "Pending") return -1
        if (a.status !== "Pending" && b.status === "Pending") return 1
        return 0
      } else if (sortOrder === "approved") {
        if (a.status === "Active" && b.status !== "Active") return -1
        if (a.status !== "Active" && b.status === "Active") return 1
        return 0
      }
      return 0
    })

  // Add pagination calculation
  // Add this after the filteredUsers definition
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Add pagination navigation functions
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

  // Add this function before the fetchUserDetails function:
  const getPasswordResetCount = async (userId: string) => {
    try {
      // Count the number of verification tokens created for password resets
      const count = await db.verificationToken.count({
        where: {
          userId: userId,
        },
      })
      return count
    } catch (error) {
      console.error("Error counting password reset requests:", error)
      return 0
    }
  }

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

      // Replace the invoice fetching code with this:
      // Fetch invoices for this user
      let userInvoices = []
      try {
        const invoicesResponse = await fetch(`/api/admin/invoices`)
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          // Filter invoices for this user and only include non-template invoices (starting with INV-)
          userInvoices = invoicesData.invoices.filter(
            (invoice: any) =>
              (invoice.userId === userId || invoice.customerEmail === data.user.email) &&
              invoice.invoiceNumber.startsWith("INV-"),
          )

          // If we have invoices, use the most recent one for subscription data
          if (userInvoices.length > 0) {
            const latestInvoice = userInvoices.sort(
              (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0]

            // Get the package/item name from the invoice items
            const packageName =
              latestInvoice.items && latestInvoice.items.length > 0 ? latestInvoice.items[0].tier : "Standard"

            subscriptionData = {
              planName: packageName,
              status: latestInvoice.status || "Inactive",
              price: latestInvoice.amount || 0,
              nextBillingDate: latestInvoice.paymentDate || latestInvoice.createdAt,
            }
          }
        }
      } catch (invoiceError) {
        console.error("Error fetching invoice data:", invoiceError)
        // Continue with default subscription data
      }

      // Extract customer contact information from invoices if not available in user data
      let customerPhone = data.user.business?.phone || "Not provided"
      let customerAddress = data.user.business?.address || "Not provided"

      // If we have invoices and the user doesn't have phone/address, try to get it from the most recent invoice
      if (userInvoices.length > 0 && (customerPhone === "Not provided" || customerAddress === "Not provided")) {
        // Sort invoices by date (newest first)
        const sortedInvoices = userInvoices.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        // Get the most recent invoice
        const latestInvoice = sortedInvoices[0]

        // Update phone if available in invoice and not in user data
        if (customerPhone === "Not provided" && latestInvoice.customerPhone) {
          customerPhone = latestInvoice.customerPhone
        }

        // Update address if available in invoice and not in user data
        if (customerAddress === "Not provided" && latestInvoice.customerAddress) {
          customerAddress = latestInvoice.customerAddress

          // If we have city/state/zip, append them to make a complete address
          if (latestInvoice.customerCity || latestInvoice.customerState || latestInvoice.customerZip) {
            customerAddress += ", "
            if (latestInvoice.customerCity) customerAddress += latestInvoice.customerCity
            if (latestInvoice.customerState)
              customerAddress += latestInvoice.customerState ? `, ${latestInvoice.customerState}` : ""
            if (latestInvoice.customerZip) customerAddress += ` ${latestInvoice.customerZip}`
          }
        }
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

              // Only override if we didn't get data from invoices
              if (userInvoices.length === 0) {
                subscriptionData = {
                  planName: activeSubscription.planName || "None",
                  status: activeSubscription.status || "Inactive",
                  price: activeSubscription.price || 0,
                  nextBillingDate: activeSubscription.nextBillingDate || null,
                }
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

      // Now update the fetchUserDetails function to properly format community activity dates
      // Find the section where we process community activities (around line 600-650)

      // Replace this part:
      // Fetch community activities for this user
      let communityActivities = []
      try {
        // Helper function to safely format dates
        const formatActivityDate = (dateString: string) => {
          try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
              return new Date().toLocaleString() // Fallback to current date if invalid
            }
            return date.toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          } catch (error) {
            console.error("Error formatting date:", error)
            return new Date().toLocaleString() // Fallback to current date
          }
        }

        // Fetch posts by this user
        const postsResponse = await fetch(`/api/community/posts?authorId=${userId}`)
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          if (postsData.success && postsData.posts) {
            communityActivities = postsData.posts.map((post: any) => ({
              type: "post",
              action: `Created post "${post.title}"`,
              date: formatActivityDate(post.createdAt),
              details: `Post ID: ${post.id}`,
              iconType: "post",
            }))
          }
        }

        // Fetch comments by this user
        const commentsResponse = await fetch(`/api/community/comments?authorId=${userId}`)
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json()
          if (commentsData.success && commentsData.comments) {
            const commentActivities = commentsData.comments.map((comment: any) => ({
              type: "comment",
              action: `Commented on a post`,
              date: formatActivityDate(comment.createdAt),
              details: comment.content.length > 50 ? `${comment.content.substring(0, 50)}...` : comment.content,
              iconType: "comment",
            }))
            communityActivities = [...communityActivities, ...commentActivities]
          }
        }

        // Fetch likes by this user
        const likesResponse = await fetch(`/api/community/likes?authorId=${userId}`)
        if (likesResponse.ok) {
          const likesData = await likesResponse.json()
          if (likesData.success && likesData.likes) {
            const likeActivities = likesData.likes.map((like: any) => ({
              type: "like",
              action: like.postId ? "Liked a post" : "Liked a comment",
              date: formatActivityDate(like.createdAt),
              details: `${like.postId ? "Post" : "Comment"} ID: ${like.postId || like.commentId}`,
              iconType: "like",
            }))
            communityActivities = [...communityActivities, ...likeActivities]
          }
        }

        // Sort all community activities by date (newest first)
        communityActivities.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Combine with existing activities
        userActivity = [...userActivity, ...communityActivities]

        // Sort all activities by date (newest first)
        userActivity.sort((a: any, b: any) => {
          const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
          const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
          return dateB.getTime() - dateA.getTime()
        })
      } catch (communityError) {
        console.error("Error fetching community activities:", communityError)
        // Continue with existing activities
      }

      // Get online status
      let isOnline = false
      try {
        const onlineResponse = await fetch("/api/admin/users/online-status")
        if (onlineResponse.ok) {
          const onlineData = await onlineResponse.json()
          isOnline = onlineData.onlineUsers?.includes(userId) || false
        }
      } catch (error) {
        console.error("Error fetching online status:", error)
      }

      // Get password reset count
      const resetCount = await getPasswordResetCount(userId)

      // Get the most recent verification token for this user (for last password reset)
      let lastPasswordReset = null
      try {
        const latestToken = await db.verificationToken.findFirst({
          where: {
            userId: userId,
          },
          orderBy: {
            expires: "desc",
          },
        })
        if (latestToken) {
          lastPasswordReset = latestToken.expires
        }
      } catch (error) {
        console.error(`Error finding latest token for user ${userId}:`, error)
      }

      // Format the last active time - use updatedAt if available, otherwise use createdAt
      let lastActiveTime = "Offline"
      if (isOnline) {
        lastActiveTime = "Online now"
      }

      // Fetch user documents
      let userDocs = []
      try {
        setLoadingDocuments(true)
        const docsResponse = await fetch(`/api/admin/documents/client?userId=${userId}&limit=5`)
        if (docsResponse.ok) {
          const docsData = await docsResponse.json()
          userDocs = docsData.documents || []
          setUserDocuments(userDocs)
        }
      } catch (docsError) {
        console.error("Error fetching user documents:", docsError)
        // Continue with empty documents array
      } finally {
        setLoadingDocuments(false)
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
        // Use the formatted lastActiveTime
        lastActive: lastActiveTime,
        phone: customerPhone,
        address: customerAddress,
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
        // Update lastPasswordChange to show the actual date if available
        lastPasswordChange: lastPasswordReset
          ? new Date(lastPasswordReset).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never",
        // Add placeholder data for documents and activity if not available
        documents: userDocs,
        activity: userActivity.length > 0 ? userActivity : [],
        isOnline: isOnline,
        invoices: userInvoices || [],
        // Add password reset count
        passwordResetCount: resetCount,
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

  // Find the confirmResetPassword function and update it to handle notifications

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

      const data = await response.json()

      // Update the user in the list with the new reset count and time
      if (data.resetCount) {
        // Use the resetTime from the API response if available
        const resetTime = data.resetTime || new Date().toISOString()

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  passwordResetCount: data.resetCount,
                  lastPasswordChange: new Date(resetTime).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : user,
          ),
        )

        // Also update the selected user if in the dialog
        if (selectedUser) {
          setSelectedUser({
            ...selectedUser,
            passwordResetCount: data.resetCount,
            lastPasswordChange: new Date(resetTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        }
      }

      // If the API returned a notification, add it to our notification system
      if (data.notification) {
        // Store the notification in localStorage so it can be picked up by the header
        const pendingNotifications = JSON.parse(localStorage.getItem("pendingNotifications") || "[]")
        pendingNotifications.push({
          title: data.notification.title,
          description: data.notification.description,
          source: data.notification.source,
        })
        localStorage.setItem("pendingNotifications", JSON.stringify(pendingNotifications))
      }

      setShowResetPasswordDialog(false)

      toast({
        title: "Password Reset",
        description: `Password reset email has been sent to ${selectedUser.email}.`,
      })

      // Refresh the user data to ensure we have the latest information
      fetchUsers()
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
          password: newUserData.password, // Send the password as plaintext
          phone: newUserData.phone,
          company: newUserData.company,
          role: newUserData.role,
          notes: newUserData.notes,
          sendInvite: newUserData.sendInvite,
          skipHashing: true, // Add this flag to tell the API not to hash the password
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

  // Find the formatDate function and update it:

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "Never") return "Never"

    try {
      // Try to parse the date
      const date = new Date(dateString)

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }

      // Format the date
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "Validation Email Sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  // Add this function near the other utility functions
  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest" | "pending" | "approved" | "none")
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Add this function to handle date filter changes
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Validate date range
    if (name === "startDate" && dateFilter.endDate && value) {
      const startDate = new Date(value)
      const endDate = new Date(dateFilter.endDate)

      if (startDate > endDate) {
        toast({
          title: "Invalid Date Range",
          description: "Start date cannot be after end date",
          variant: "destructive",
        })
        return
      }
    }

    if (name === "endDate" && dateFilter.startDate && value) {
      const startDate = new Date(dateFilter.startDate)
      const endDate = new Date(value)

      if (startDate > endDate) {
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

  // Add this function to reset filters
  const resetFilters = () => {
    setSortOrder("none")
    setDateFilter({ startDate: "", endDate: "" })
    setCurrentPage(1)
  }

  // Replace the loading state with a more attractive loader (around line 620)
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

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="h-6 w-6 text-[#22c984]" />
            </div>
          </div>
          <p className="text-base font-medium text-muted-foreground">Loading users...</p>
        </div>
      </div>
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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto mb-40">
      {/* Include the online status tracker */}
      <OnlineStatusTracker />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all users in the system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportUserData}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          {/* Update the Add User button color (around line 660) */}
          <Button className="bg-[#22c984] hover:bg-[#1ba36d]" onClick={() => setShowAddUserDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search - Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

        <div>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger>
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {sortOrder === "newest"
                    ? "Newest First"
                    : sortOrder === "oldest"
                      ? "Oldest First"
                      : sortOrder === "pending"
                        ? "Pending First"
                        : sortOrder === "approved"
                          ? "Approved First"
                          : "Sort Users"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sorting</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="pending">Pending First</SelectItem>
              <SelectItem value="approved">Approved First</SelectItem>
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

        <div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(sortOrder !== "none" || dateFilter.startDate || dateFilter.endDate) && (
        <div className="flex flex-wrap items-center mb-4 p-2 bg-muted rounded-md">
          <div className="flex-1 flex flex-wrap gap-2 mb-2 sm:mb-0">
            <span className="text-sm font-medium">Active Filters:</span>
            {sortOrder !== "none" && (
              <Badge variant="outline" className="mr-2">
                {sortOrder === "newest"
                  ? "Newest First"
                  : sortOrder === "oldest"
                    ? "Oldest First"
                    : sortOrder === "pending"
                      ? "Pending First"
                      : "Approved First"}
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
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <FilterX className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      )}

      {/* Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 min-w-[500px]">
          <TabsList>
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
              getStatusColor={getStatusColor}
            />
            {/* Add Pagination */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                  </span>{" "}
                  to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
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

          {/* Do the same for the other TabsContent sections (active, pending, inactive, validationEmailSent) */}
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
              getStatusColor={getStatusColor}
            />
            {/* Add Pagination */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                  </span>{" "}
                  to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
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
              getStatusColor={getStatusColor}
            />
            {/* Add Pagination */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                  </span>{" "}
                  to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
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
              getStatusColor={getStatusColor}
            />
            {/* Add Pagination */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                  </span>{" "}
                  to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
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
              getStatusColor={getStatusColor}
            />
            {/* Add Pagination */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}
                  </span>{" "}
                  to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> users
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
      </div>

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
                        {selectedUser.role}
                      </span>

                      <div className="mt-6 w-full">
                        <div className="flex items-center text-sm mb-2">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.phone || "Not provided"}
                        </div>
                        <div className="flex items-start text-sm mb-2">
                          <Building className="h-5 w-5 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-left">{selectedUser.address || "Not provided"}</span>
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
                    </div>
                  </Card>
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
                      <div className="space-y-3">
                        {selectedUser.activity.slice(0, 4).map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
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
                              <p className="text-sm font-medium">{activity.action}</p>
                              <p className="text-xs text-gray-500">
                                {typeof activity.date === "string"
                                  ? new Date(activity.date).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Unknown date"}
                              </p>
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

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                Cancel
              </Button>
              {/* Change the Save Changes button color (around line 1080) */}
              <Button onClick={handleSaveUser} disabled={processingAction} className="bg-[#22c984] hover:bg-[#1ba36d]">
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
              {/* Change the Update Role button color (around line 1120) */}
              <Button
                onClick={confirmChangeRole}
                disabled={processingAction}
                className="bg-[#22c984] hover:bg-[#1ba36d]"
              >
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
  formatDate,
  getStatusColor,
}: {
  users: UserData[]
  onViewUser: (userData: UserData) => void
  onEditUser: (userData: UserData) => void
  onResetPassword: (userData: UserData) => void
  onChangeRole: (userData: UserData) => void
  onToggleStatus: (userData: UserData) => void
  onDeleteUser: (userData: UserData) => void
  loading: boolean
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => string
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
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Role</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Company</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Last Active</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {user.isOnline && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    )}
                    <span className="truncate max-w-[120px] md:max-w-none">{user.name}</span>
                  </div>
                </td>
                <td className="p-4 truncate max-w-[120px] md:max-w-none">{user.email}</td>
                <td className="p-4">
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                </td>
                <td className="p-4 hidden md:table-cell">{user.role}</td>
                <td className="p-4 hidden lg:table-cell truncate max-w-[120px] xl:max-w-none">{user.company}</td>
                <td className="p-4 hidden lg:table-cell">
                  {user.isOnline ? <span className="text-green-600 font-medium">Online</span> : <span>Offline</span>}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => onViewUser(user)}>
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewUser(user)} className="sm:hidden">
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(user)}>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeRole(user)}>Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                          {user.status === "Active" ? "Suspend Account" : "Activate Account"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDeleteUser(user)}
                        >
                          Delete Account
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

