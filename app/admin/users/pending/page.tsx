"use client"

import { Pagination } from "@/components/ui/pagination"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Phone, User, ChevronLeft, ChevronRight, Copy, Eye, Filter } from "lucide-react"
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
    annualReportFee?: number
    annualReportFrequency?: number
    completedAt?: string | null
  }
  phoneRequest?: PhoneNumberRequest
  accountManagerRequest?: AccountManagerRequest
  address?: UserAddress
}

// Add this interface to the existing interfaces at the top of the file
interface UserAddress {
  id?: string
  userId: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  createdAt?: string
  updatedAt?: string
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

export default function PendingUsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [showAccountManagerDialog, setShowAccountManagerDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
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
    annualReportFee: 100,
    annualReportFrequency: 1,
    completedAt: null as string | null, // Add this field to track when the LLC was completed
  })
  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    status: "pending" as "requested" | "pending" | "approved" | "rejected",
  })
  const [accountManagerFormData, setAccountManagerFormData] = useState({
    managerName: "",
    contactLink: "",
    status: "pending" as "requested" | "pending" | "approved" | "rejected",
  })
  const [processingAction, setProcessingAction] = useState(false)
  const [processingPhoneAction, setProcessingPhoneAction] = useState(false)
  const [processingManagerAction, setProcessingManagerAction] = useState(false)

  // Add these new state variables after the existing state declarations
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  })
  const [processingAddressAction, setProcessingAddressAction] = useState(false)
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
            annualReportFee: data.business.annualReportFee || 100,
            annualReportFrequency: data.business.annualReportFrequency || 1,
            completedAt: data.business.completedAt || null,
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

  // Add this function to fetch account manager request data
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

  // Add this function after fetchUserAccountManagerRequest
  const fetchUserAddress = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/address`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
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

  const viewPhoneRequest = async (user: PendingUser) => {
    setSelectedUser(user)

    // Initialize form data with existing phone request if available
    if (user.phoneRequest) {
      setPhoneFormData({
        phoneNumber: user.phoneRequest.phoneNumber || "",
        status: user.phoneRequest.status,
      })
    } else {
      // Reset form if no existing request
      setPhoneFormData({
        phoneNumber: "",
        status: "pending",
      })
    }

    setShowPhoneDialog(true)
  }

  // Add this function to view account manager request
  const viewAccountManagerRequest = async (user: PendingUser) => {
    setSelectedUser(user)

    // Initialize form data with existing account manager request if available
    if (user.accountManagerRequest) {
      setAccountManagerFormData({
        managerName: user.accountManagerRequest.managerName || "",
        contactLink: user.accountManagerRequest.contactLink || "",
        status: user.accountManagerRequest.status,
      })
    } else {
      // Reset form if no existing request
      setAccountManagerFormData({
        managerName: "",
        contactLink: "",
        status: "pending",
      })
    }

    setShowAccountManagerDialog(true)
  }

  // Add this function to view user address
  const viewUserAddress = async (user: PendingUser) => {
    setSelectedUser(user)

    // Initialize form data with existing address if available
    if (user.address) {
      setAddressFormData({
        addressLine1: user.address.addressLine1 || "",
        addressLine2: user.address.addressLine2 || "",
        city: user.address.city || "",
        state: user.address.state || "",
        zipCode: user.address.zipCode || "",
        country: user.address.country || "United States",
      })
    } else {
      // Reset form if no existing address
      setAddressFormData({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      })
    }

    setShowAddressDialog(true)
  }

  // Update the handleInputChange function to handle numeric values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Don't allow businessId to be changed
    // if (name === "businessId") return

    if (name === "annualReportFee") {
      // Ensure it's a valid number
      const numValue = Number.parseInt(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setBusinessFormData((prev) => ({ ...prev, [name]: numValue }))
      }
    } else {
      setBusinessFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle phone form input changes
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPhoneFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle account manager form input changes
  const handleAccountManagerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAccountManagerFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Add this function to handle address form input changes
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAddressFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the handleSelectChange function to handle numeric values
  const handleSelectChange = (name: string, value: string) => {
    if (name === "annualReportFrequency") {
      const numValue = Number.parseInt(value)
      if (!isNaN(numValue)) {
        setBusinessFormData((prev) => ({ ...prev, [name]: numValue }))
      }
    } else {
      setBusinessFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle phone status select change
  const handlePhoneStatusChange = (value: string) => {
    setPhoneFormData((prev) => ({
      ...prev,
      status: value as "requested" | "pending" | "approved" | "rejected",
    }))
  }

  // Handle account manager status select change
  const handleAccountManagerStatusChange = (value: string) => {
    setAccountManagerFormData((prev) => ({
      ...prev,
      status: value as "requested" | "pending" | "approved" | "rejected",
    }))
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)

    // If progress is set to 100%, automatically update the status message and set completedAt timestamp
    if (value === 100 && businessFormData.llcProgress !== 100) {
      setBusinessFormData((prev) => ({
        ...prev,
        llcProgress: value,
        llcStatusMessage: "Congratulations your LLC is formed",
        completedAt: new Date().toISOString(), // Set the completion timestamp
      }))
    } else {
      setBusinessFormData((prev) => ({ ...prev, llcProgress: value }))
    }
  }

  const saveBusinessData = async () => {
    if (!selectedUser) return

    setProcessingAction(true)

    try {
      // If progress is 100% but completedAt is not set, set it now
      const dataToSend = {
        ...businessFormData,
        // Ensure completedAt is set if progress is 100%
        completedAt:
          businessFormData.llcProgress === 100 && !businessFormData.completedAt
            ? new Date().toISOString()
            : businessFormData.completedAt,
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error("Failed to update business information")
      }

      toast({
        title: "Success",
        description: "Business information updated successfully.",
      })

      // Update the local state
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
                annualReportFee: businessFormData.annualReportFee,
                annualReportFrequency: businessFormData.annualReportFrequency,
                completedAt: dataToSend.completedAt,
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

  const savePhoneRequestData = async () => {
    if (!selectedUser) return

    setProcessingPhoneAction(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/phone-request`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(phoneFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to update phone request information")
      }

      toast({
        title: "Success",
        description: "Phone request information updated successfully.",
      })

      // Update the local state
      setPendingUsers((prev) =>
        prev.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              phoneRequest: {
                ...(user.phoneRequest || { userId: user.id }),
                phoneNumber: phoneFormData.phoneNumber,
                status: phoneFormData.status,
              },
            }
          }
          return user
        }),
      )

      setShowPhoneDialog(false)
    } catch (error) {
      console.error("Error updating phone request information:", error)
      toast({
        title: "Error",
        description: "Failed to update phone request information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingPhoneAction(false)
    }
  }

  // Add this function to save account manager request data
  const saveAccountManagerData = async () => {
    if (!selectedUser) return

    setProcessingManagerAction(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/account-manager`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(accountManagerFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to update account manager information")
      }

      toast({
        title: "Success",
        description: "Account manager information updated successfully.",
      })

      // Update the local state
      setPendingUsers((prev) =>
        prev.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              accountManagerRequest: {
                ...(user.accountManagerRequest || { userId: user.id }),
                managerName: accountManagerFormData.managerName,
                contactLink: accountManagerFormData.contactLink,
                status: accountManagerFormData.status,
              },
            }
          }
          return user
        }),
      )

      setShowAccountManagerDialog(false)
    } catch (error) {
      console.error("Error updating account manager information:", error)
      toast({
        title: "Error",
        description: "Failed to update account manager information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingManagerAction(false)
    }
  }

  // Add this function to save address data
  const saveAddressData = async () => {
    if (!selectedUser) return

    setProcessingAddressAction(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(addressFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to update address information")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Address information updated successfully.",
      })

      // Update the local state
      setPendingUsers((prev) =>
        prev.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              address: data.address,
            }
          }
          return user
        }),
      )

      setShowAddressDialog(false)

      // Refresh the data to ensure we have the latest
      fetchUsers()
    } catch (error) {
      console.error("Error updating address information:", error)
      toast({
        title: "Error",
        description: "Failed to update address information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAddressAction(false)
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
      if (dateFilter.startDate && dateFilter.endDate && user.business?.formationDate) {
        const formationDate = new Date(user.business.formationDate)
        const startDate = new Date(dateFilter.startDate)
        const endDate = new Date(dateFilter.endDate)

        // Ensure end date is set to end of day for inclusive comparison
        endDate.setHours(23, 59, 59, 999)

        // Only apply filter if date range is valid (start <= end)
        if (startDate <= endDate) {
          matchesDateRange = formationDate >= startDate && formationDate <= endDate
        }
      } else if (dateFilter.startDate && user.business?.formationDate) {
        // Only start date is set
        const formationDate = new Date(user.business.formationDate)
        const startDate = new Date(dateFilter.startDate)
        matchesDateRange = formationDate >= startDate
      } else if (dateFilter.endDate && user.business?.formationDate) {
        // Only end date is set
        const formationDate = new Date(user.business.formationDate)
        const endDate = new Date(dateFilter.endDate)
        endDate.setHours(23, 59, 59, 999)
        matchesDateRange = formationDate <= endDate
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

  // Get phone request button text
  const getPhoneRequestButtonText = (user: PendingUser) => {
    if (!user.phoneRequest) {
      return null // Don't show button if no request
    }

    if (user.phoneRequest.phoneNumber) {
      return "View Client US Number"
    }

    return "US Phone Number Request"
  }

  // Get account manager request button text
  const getAccountManagerButtonText = (user: PendingUser) => {
    if (!user.accountManagerRequest) {
      return null // Don't show button if no request
    }

    if (user.accountManagerRequest.managerName) {
      return "View Account Manager"
    }

    return "Account Manager Request"
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

  // Add the US states array for the dropdown
  const US_STATES = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
    { value: "DC", label: "District of Columbia" },
    { value: "AS", label: "American Samoa" },
    { value: "GU", label: "Guam" },
    { value: "MP", label: "Northern Mariana Islands" },
    { value: "PR", label: "Puerto Rico" },
    { value: "VI", label: "U.S. Virgin Islands" },
  ]

  return (
    <div className="px-3 sm:px-4 md:px-6 max-w-[1600px] mx-auto mb-20 md:mb-40 overflow-x-hidden">
      <style jsx global>
        {globalStyles}
      </style>
      {/* Rest of the component */}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">LLC Management</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
            Manage business information and LLC status
          </p>
        </div>
        <div className="flex items-center mt-3 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center w-full md:w-auto justify-center"
            onClick={fetchUsers}
          >
            <Filter className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Replace the search div with this updated version that includes filters */}
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="w-full">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full">
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

          <div className="w-full">
            <Input
              type="date"
              placeholder="Start Date"
              value={dateFilter.startDate}
              onChange={(e) => {
                const newStartDate = e.target.value
                // Validate that start date is before end date if both exist
                if (newStartDate && dateFilter.endDate && new Date(newStartDate) > new Date(dateFilter.endDate)) {
                  toast({
                    title: "Invalid Date Range",
                    description: "The start date must be before or equal to the end date.",
                    variant: "destructive",
                  })
                  return // Don't update with invalid range
                }
                setDateFilter((prev) => ({ ...prev, startDate: newStartDate }))
              }}
              className="w-full"
            />
          </div>
          <div className="w-full">
            <Input
              type="date"
              placeholder="End Date"
              value={dateFilter.endDate}
              onChange={(e) => {
                const newEndDate = e.target.value
                // Validate that end date is after start date if both exist
                if (dateFilter.startDate && newEndDate && new Date(dateFilter.startDate) > new Date(newEndDate)) {
                  toast({
                    title: "Invalid Date Range",
                    description: "The end date must be after or equal to the start date.",
                    variant: "destructive",
                  })
                  return // Don't update with invalid range
                }
                setDateFilter((prev) => ({ ...prev, endDate: newEndDate }))
              }}
              className="w-full"
            />
          </div>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <div className="flex items-center justify-start sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                className="h-10"
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
                  className="h-4 w-4 mr-2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Clear Dates
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 md:mb-6">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="all" className="py-2 text-xs md:text-sm">
            All Users ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="py-2 text-xs md:text-sm">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="py-2 text-xs md:text-sm">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="py-2 text-xs md:text-sm">
            Rejected ({rejectedCount})
          </TabsList>

        <TabsContent value="all">
          <UserList
            users={paginatedUsers}
            onViewDetails={viewUserDetails}
            onViewPhoneRequest={viewPhoneRequest}
            onViewAccountManagerRequest={viewAccountManagerRequest}
            onViewAddress={viewUserAddress}
            copyToClipboard={copyToClipboard}
          />
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
          <UserList
            users={paginatedUsers}
            onViewDetails={viewUserDetails}
            onViewPhoneRequest={viewPhoneRequest}
            onViewAccountManagerRequest={viewAccountManagerRequest}
            onViewAddress={viewUserAddress}
            copyToClipboard={copyToClipboard}
          />
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
          <UserList
            users={paginatedUsers}
            onViewDetails={viewUserDetails}
            onViewPhoneRequest={viewPhoneRequest}
            onViewAccountManagerRequest={viewAccountManagerRequest}
            onViewAddress={viewUserAddress}
            copyToClipboard={copyToClipboard}
          />
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
          <UserList
            users={paginatedUsers}
            onViewDetails={viewUserDetails}
            onViewPhoneRequest={viewPhoneRequest}
            onViewAccountManagerRequest={viewAccountManagerRequest}
            onViewAddress={viewUserAddress}
            copyToClipboard={copyToClipboard}
          />
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
          <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                      <Label htmlFor="businessId">Business ID</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="businessId"
                          name="businessId"
                          value={businessFormData.businessId}
                          onChange={handleInputChange}
                          className="mt-1"
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
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-sm mb-3 mt-2">Annual Report Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="annualReportFee">Annual Report Fee ($)</Label>
                          <Input
                            id="annualReportFee"
                            name="annualReportFee"
                            type="number"
                            min="0"
                            value={businessFormData.annualReportFee}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="annualReportFrequency">Report Frequency (Years)</Label>
                          <Select
                            value={businessFormData.annualReportFrequency.toString()}
                            onValueChange={(value) => handleSelectChange("annualReportFrequency", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Every 1 Year</SelectItem>
                              <SelectItem value="2">Every 2 Years</SelectItem>
                              <SelectItem value="3">Every 3 Years</SelectItem>
                              <SelectItem value="5">Every 5 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Annual report will be due every {businessFormData.annualReportFrequency}{" "}
                        {businessFormData.annualReportFrequency === 1 ? "year" : "years"} from the formation date.
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

      {/* Phone Number Request Dialog */}
      {selectedUser && (
        <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DialogContent className="w-[95vw] max-w-[500px] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>US Phone Number Request</DialogTitle>
              <DialogDescription>
                {selectedUser.phoneRequest
                  ? "Update the client's US phone number request status"
                  : "This client has not requested a US phone number yet"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client Information</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    {selectedUser.phoneRequest && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-500">
                          Request Status:{" "}
                          <span className="font-medium capitalize">{selectedUser.phoneRequest.status}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested:{" "}
                          {selectedUser.phoneRequest.createdAt
                            ? new Date(selectedUser.phoneRequest.createdAt).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phoneNumber">US Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="e.g. +1 (555) 123-4567"
                    value={phoneFormData.phoneNumber}
                    onChange={handlePhoneInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Request Status</Label>
                  <Select value={phoneFormData.status} onValueChange={handlePhoneStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePhoneRequestData} disabled={processingPhoneAction}>
                {processingPhoneAction ? "Saving..." : "Save Phone Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Account Manager Request Dialog */}
      {selectedUser && (
        <Dialog open={showAccountManagerDialog} onOpenChange={setShowAccountManagerDialog}>
          <DialogContent className="w-[95vw] max-w-[500px] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Account Manager Request</DialogTitle>
              <DialogDescription>
                {selectedUser.accountManagerRequest
                  ? "Update the client's account manager request status"
                  : "This client has not requested a dedicated account manager yet"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client Information</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    {selectedUser.accountManagerRequest && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-500">
                          Request Status:{" "}
                          <span className="font-medium capitalize">{selectedUser.accountManagerRequest.status}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested:{" "}
                          {selectedUser.accountManagerRequest.createdAt
                            ? new Date(selectedUser.accountManagerRequest.createdAt).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="managerName">Account Manager Name</Label>
                  <Input
                    id="managerName"
                    name="managerName"
                    placeholder="e.g. John Smith"
                    value={accountManagerFormData.managerName}
                    onChange={handleAccountManagerInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactLink">Contact Link</Label>
                  <Input
                    id="contactLink"
                    name="contactLink"
                    placeholder="e.g. https://calendly.com/john-smith"
                    value={accountManagerFormData.contactLink}
                    onChange={handleAccountManagerInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Request Status</Label>
                  <Select value={accountManagerFormData.status} onValueChange={handleAccountManagerStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAccountManagerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveAccountManagerData} disabled={processingManagerAction}>
                {processingManagerAction ? "Saving..." : "Save Account Manager"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* USA Address Dialog */}
      {selectedUser && (
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="w-[95vw] max-w-[500px] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Manage USA Address</DialogTitle>
              <DialogDescription>
                {selectedUser.address
                  ? "Update the client's USA address"
                  : "Add a USA address for this client"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client Information</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    {selectedUser.address && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-500">
                          Current Address: {selectedUser.address.addressLine1}
                          {selectedUser.address.addressLine2 ? `, ${selectedUser.address.addressLine2}` : ''}
                          , {selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="e.g. 123 Main St"
                    value={addressFormData.addressLine1}
                    onChange={handleAddressInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    placeholder="e.g. Apt 4B, Suite 200"
                    value={addressFormData.addressLine2 || ''}
                    onChange={handleAddressInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g. New York"
                    value={addressFormData.city}
                    onChange={handleAddressInputChange}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select
                      name="state"
                      value={addressFormData.state}
                      onValueChange={(value) => setAddressFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="e.g. 10001"
                      value={addressFormData.zipCode}
                      onChange={handleAddressInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={addressFormData.country}
                    onChange={handleAddressInputChange}
                    className="mt-1"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: United States</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveAddressData} disabled={processingAddressAction}>
                {processingAddressAction ? "Saving..." : "Save Address"}
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
    const maxPagesToShow = 3 // Show fewer pages on mobile

    if (totalPages <= maxPagesToShow) {
      // If we have 3 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)

      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 0)
      let endPage = Math.min(totalPages - 1, currentPage + 0)

      // Adjust if we're near the beginning
      if (currentPage <= 2) {
        endPage = 2
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 1
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
    <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-0 text-center sm:text-left">
        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {pageNumbers.map((pageNumber, index) => {
          // Render ellipsis
          if (pageNumber < 0) {
            return (
              <span key={`ellipsis-${index}`} className="px-1 sm:px-2">
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
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs"
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
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
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
  onViewPhoneRequest,
  onViewAccountManagerRequest,
  onViewAddress,
  copyToClipboard,
}: {
  users: PendingUser[]
  onViewDetails: (user: PendingUser) => void
  onViewPhoneRequest: (user: PendingUser) => void
  onViewAccountManagerRequest: (user: PendingUser) => void
  onViewAddress: (user: PendingUser) => void
  copyToClipboard: (text: string, label: string) => void
}) {
  const getPhoneRequestButtonText = (user: PendingUser) => {
    if (!user.phoneRequest) {
      return null // Don't show button if no request
    }

    if (user.phoneRequest.phoneNumber) {
      return "View Client US Number"
    }

    return "US Phone Number Request"
  }

  const getAccountManagerButtonText = (user: PendingUser) => {
    if (!user.accountManagerRequest) {
      return null // Don't show button if no request
    }

    if (user.accountManagerRequest.managerName) {
      return "View Account Manager"
    }

    return "Account Manager Request"
  }

  if (users.length === 0) {
    return <div className="text-center py-4">No users found.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => {
        const phoneRequestButtonText = getPhoneRequestButtonText(user)
        const accountManagerButtonText = getAccountManagerButtonText(user)

        return (
          <Card key={user.id} className="bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{user.name}</h3>
                <Eye
                  className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                  onClick={() => onViewDetails(user)}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{user.email}</p>

              {/* Business Information */}
              {user.business && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Business: {user.business.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status: {user.business.serviceStatus || "N/A"}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <Button size="sm" onClick={() => onViewDetails(user)}>
                  View LLC Details
                </Button>

                {/* Phone Request Button */}
                {phoneRequestButtonText && (
                  <Button size="sm" variant="secondary" onClick={() => onViewPhoneRequest(user)}>
                    {phoneRequestButtonText}
                  </Button>
                )}

                {/* Account Manager Request Button */}
                {accountManagerButtonText && (
                  <Button size="sm" variant="secondary" onClick={() => onViewAccountManagerRequest(user)}>
                    {accountManagerButtonText}
                  </Button>
                )}

                {/* USA Address Button */}
                <Button size="sm" variant="secondary" onClick={() => onViewAddress(user)}>
                  Manage USA Address
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 flex justify-between items-center">
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(user.email, "Email")}>
                <User className="h-4 w-4" />
              </Button>
              {user.phoneRequest?.phoneNumber ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(user.phoneRequest?.phoneNumber, "Phone Number")}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

