"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Flag,
  Building2,
  Hash,
  Bell,
  Phone,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CalendarIcon,
  Clock,
  DollarSign,
  PenTool,
  FileText,
  Tag,
} from "lucide-react"
// Add after the imports
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import SpendingAnalytics from "@/components/spending-analytics"
// Import the AccountManagerRequest component at the top of the file
import { AccountManagerRequest } from "@/components/account-manager-request"
// Import the ContactPopup component at the top of the file:
import { ContactPopup } from "@/components/contact-popup"
// Add these imports at the top of the file with the other imports
import { getUserTickets } from "@/lib/actions/ticket-actions"
import Link from "next/link"

// Add these imports at the top of the file
import { formatCouponValue } from "@/lib/coupon"
import type { CouponType } from "@/lib/prisma-types"

// Add custom animation styles
const pulseSubtleKeyframes = `
  @keyframes pulseSubtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`

// Add the style element to the component
const AnimationStyles = () => (
  <style jsx global>{`
    ${pulseSubtleKeyframes}
    .animate-pulse-subtle {
      animation: pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `}</style>
)

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerZip?: string
  customerCountry?: string
  amount: number
  status: string
  createdAt: string
  updatedAt: string
  userId?: string
}

interface PhoneNumberRequest {
  id?: string
  status: "requested" | "pending" | "approved" | "rejected"
  phoneNumber?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

interface AccountManagerRequestType {
  id?: string
  status: "requested" | "pending" | "approved" | "rejected"
  managerName?: string
  contactLink?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  price: number
  pricingTier: string
  isPurchased: boolean
  isPending: boolean
  isFree?: boolean
  invoiceId?: string
  fileUrl?: string
  updatedAt: string
  status?: string
  usageCount?: number
  downloadCount?: number // User-specific download count
}

// Add this interface with the other interfaces
interface Coupon {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  expiresAt: string
  minimumAmount: number | null
}

// Add these interfaces after the other interfaces
interface Amendment {
  id: string
  type: string
  details: string
  status:
    | "pending"
    | "in_review"
    | "waiting_for_payment"
    | "payment_confirmation_pending"
    | "payment_received"
    | "approved"
    | "rejected"
    | "amendment_in_progress"
    | "amendment_resolved"
    | "closed"
  createdAt: string
  updatedAt: string
  paymentAmount?: number | string
  notes?: string
  documentUrl?: string
  receiptUrl?: string
}

interface Deadline {
  id: string
  title: string
  description: string | null
  dueDate: string
  fee: number
  lateFee: number | null
  status: string
}

// Add this interface after the other interfaces
interface Ticket {
  id: string
  subject: string
  status: "open" | "closed" | "pending"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  createdAt: string
  updatedAt: string
}

// Add this interface after the other interfaces
interface UserAddress {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  createdAt: string
  updatedAt: string
}

// Attractive loader component
const DashboardLoader = () => {
  return (
    <div className="p-8 flex flex-col justify-center items-center min-h-screen">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div
          className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
          style={{ animationDuration: "1.5s" }}
        ></div>
      </div>
      <h3 className="text-xl font-medium text-gray-700 mb-2">Loading your dashboard</h3>
      <p className="text-gray-500">Preparing your business information...</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requestingPhone, setRequestingPhone] = useState(false)
  const [requestingManager, setRequestingManager] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [userDownloadCounts, setUserDownloadCounts] = useState<Record<string, number>>({})
  const [businessData, setBusinessData] = useState({
    name: "",
    businessId: "",
    formationDate: "",
    ein: "",
    serviceStatus: "Pending",
    llcStatus: "In Progress",
    llcProgress: 0,
    llcStatusMessage: "LLC formation initiated",
    annualReportFee: 100,
    annualReportFrequency: 1, // in years
    annualReportDueDate: "", // will be calculated based on formation date
    annualReportDate: "", // Add this field to store the custom date
  })
  const [userAddress, setUserAddress] = useState({
    address: "Your Business address will appear here when approved ", // Default address
    customerAddress: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    customerCountry: "",
  })
  const [phoneNumberRequest, setPhoneNumberRequest] = useState<PhoneNumberRequest | null>(null)
  const [accountManagerRequest, setAccountManagerRequest] = useState<AccountManagerRequestType | null>(null)
  // Update the DashboardPage component to include ticket state
  // Add this to the state declarations at the top of the component
  // Add this to the state declarations at the top of the component
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  // Add these state variables in the DashboardPage component
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([])
  const [amendmentsLoading, setAmendmentsLoading] = useState(true)
  const [deadlinesLoading, setDeadlinesLoading] = useState(true)

  // Add this state variable with the other state variables in the DashboardPage component
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)

  // Add this state variable with the other state variables
  const [userAddressData, setUserAddressData] = useState<UserAddress | null>(null)

  const fetchAmendments = async () => {
    try {
      setAmendmentsLoading(true)
      // Use the same endpoint as in the amendments page
      const response = await fetch("/api/amendments")
      if (!response.ok) {
        throw new Error("Failed to fetch amendments")
      }

      const data = await response.json()

      // Get all amendments
      const allAmendments = data.amendments || []

      // Filter active amendments (not closed)
      const activeAmendments = allAmendments.filter((a: Amendment) => a.status !== "closed")

      setAmendments(activeAmendments)
    } catch (error) {
      console.error("Error fetching amendments:", error)
      // Set empty array in case of error
      setAmendments([])
    } finally {
      setAmendmentsLoading(false)
    }
  }

  const fetchDeadlines = async () => {
    try {
      setDeadlinesLoading(true)
      // Use the same endpoints as in the annual reports page
      const deadlinesResponse = await fetch("/api/annual-reports/deadlines")
      if (!deadlinesResponse.ok) throw new Error("Failed to fetch deadlines")
      const deadlinesData = await deadlinesResponse.json()

      const filingsResponse = await fetch("/api/annual-reports/filings")
      if (!filingsResponse.ok) throw new Error("Failed to fetch filings")
      const filingsData = await filingsResponse.json()

      // Process filings to ensure they have the right format
      const processedFilings =
        filingsData.filings?.map((filing: any) => {
          // Find the associated deadline from deadlinesData
          const deadline = deadlinesData.deadlines?.find((d: Deadline) => d.id === filing.deadlineId)

          return {
            ...filing,
            deadlineTitle: filing.deadlineTitle || (deadline ? deadline.title : "Unknown Deadline"),
            dueDate: filing.dueDate || (deadline ? deadline.dueDate : null),
            deadline: deadline
              ? {
                  title: deadline.title,
                  dueDate: deadline.dueDate,
                }
              : filing.deadline || null,
          }
        }) || []

      // Update deadline statuses based on filings
      let updatedDeadlines = deadlinesData.deadlines || []

      if (processedFilings.length > 0 && updatedDeadlines.length > 0) {
        // Create a map of the latest filing status for each deadline
        const deadlineFilingStatusMap = new Map()

        processedFilings.forEach((filing: any) => {
          // Only update if this is a newer filing or we don't have one yet
          if (
            !deadlineFilingStatusMap.has(filing.deadlineId) ||
            new Date(filing.createdAt || 0) > new Date(deadlineFilingStatusMap.get(filing.deadlineId)?.createdAt || 0)
          ) {
            deadlineFilingStatusMap.set(filing.deadlineId, filing)
          }
        })

        // Update deadline statuses based on filing statuses
        updatedDeadlines = updatedDeadlines.map((deadline: Deadline) => {
          const latestFiling = deadlineFilingStatusMap.get(deadline.id)

          if (latestFiling) {
            // If there's a filing, update the deadline status based on the filing status
            return { ...deadline, status: latestFiling.status }
          }

          // If no filing or status doesn't need updating, return the original deadline
          return deadline
        })
      }

      // Filter out completed or rejected deadlines from upcoming deadlines
      const filteredDeadlines = updatedDeadlines.filter(
        (deadline: Deadline) => deadline.status !== "completed" && deadline.status !== "rejected",
      )

      setUpcomingDeadlines(filteredDeadlines)
    } catch (error) {
      console.error("Error fetching deadlines:", error)
      // Set empty array in case of error
      setUpcomingDeadlines([])
    } finally {
      setDeadlinesLoading(false)
    }
  }

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Add this function to fetch tickets
  const fetchTickets = async () => {
    try {
      const { tickets, error } = await getUserTickets()
      if (!error && tickets) {
        setTickets(tickets)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setTicketsLoading(false)
    }
  }

  // Add this function to fetch coupons
  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true)
      const response = await fetch("/api/coupons/user")

      if (!response.ok) {
        throw new Error("Failed to fetch coupons")
      }

      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error("Error fetching coupons:", error)
    } finally {
      setCouponsLoading(false)
    }
  }

  // Add this function to fetch the user's address
  const fetchUserAddress = async () => {
    try {
      const response = await fetch("/api/user/address")
      if (response.ok) {
        const data = await response.json()
        if (data.address) {
          setUserAddressData(data.address)
          console.log("User address fetched successfully:", data.address)
          return data.address
        }
      } else {
        console.error("Error fetching user address: API returned status", response.status)
      }
      return null
    } catch (error) {
      console.error("Error fetching user address:", error)
      return null
    }
  }

  // Add fetchTickets to the useEffect that runs when session is available
  // Find the useEffect that includes fetchBusinessData and add fetchTickets
  // Modify the useEffect to include fetchTickets:
  useEffect(() => {
    if (session) {
      // Fetch user address first and don't use invoice data for address
      fetchUserAddress().then(() => {
        fetchBusinessData()
        fetchPhoneNumberRequest()
        fetchAccountManagerRequest()
        fetchTemplates()
        fetchUserDownloadCounts()
        fetchTickets()
        fetchAmendments()
        fetchDeadlines()
        fetchCoupons()
        fetchUserInvoices() // Keep this for other invoice data, but not for address
      })
    } else {
      setLoading(false)
    }
  }, [session])

  // Fix the incrementUserDownloadCount function to properly update localStorage
  // Replace the existing incrementUserDownloadCount function with this improved version:

  const incrementUserDownloadCount = async (templateId: string) => {
    try {
      // First, get the latest counts from localStorage to ensure we have the most up-to-date data
      let currentCounts = {}
      try {
        const storedCounts = localStorage.getItem("templateDownloadCounts")
        if (storedCounts) {
          currentCounts = JSON.parse(storedCounts)
        }
      } catch (localStorageError) {
        console.error("Error reading from localStorage:", localStorageError)
      }

      // Update the counts with the new increment
      const updatedCounts = {
        ...currentCounts,
        [templateId]: ((currentCounts as any)[templateId] || 0) + 1,
      }

      // Update local state
      setUserDownloadCounts(updatedCounts)

      // Store in localStorage
      try {
        localStorage.setItem("templateDownloadCounts", JSON.stringify(updatedCounts))
      } catch (localStorageError) {
        console.error("Error writing to localStorage:", localStorageError)
      }

      // Send to server
      const response = await fetch("/api/user/templates/download-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId }),
      })

      if (!response.ok) {
        console.warn("Failed to increment download count on server, but local state was updated")
      }
    } catch (error) {
      console.error("Error incrementing download count:", error)
      // Continue with download even if count increment fails
    }
  }

  // Fix the fetchUserDownloadCounts function to properly retrieve from localStorage
  // Replace the existing fetchUserDownloadCounts function with this improved version:

  const fetchUserDownloadCounts = async () => {
    // First try to get counts from localStorage for immediate display
    try {
      const storedCounts = localStorage.getItem("templateDownloadCounts")
      if (storedCounts) {
        const parsedCounts = JSON.parse(storedCounts)
        setUserDownloadCounts(parsedCounts)
      }
    } catch (localStorageError) {
      console.error("Error reading from localStorage:", localStorageError)
    }

    // Then try to fetch from API to ensure we have the latest data
    try {
      const response = await fetch("/api/user/templates/download-count")
      if (response.ok) {
        const data = await response.json()
        if (data.downloadCounts) {
          // Merge API data with localStorage data to ensure we don't lose any counts
          const mergedCounts = { ...userDownloadCounts, ...data.downloadCounts }
          setUserDownloadCounts(mergedCounts)

          // Update localStorage with the merged data
          try {
            localStorage.setItem("templateDownloadCounts", JSON.stringify(mergedCounts))
          } catch (storageError) {
            console.error("Error updating localStorage after API fetch:", storageError)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user download counts from API:", error)
      // We already loaded from localStorage, so we can continue
    }
  }

  // Add this function to fetch account manager request
  const fetchAccountManagerRequest = async () => {
    try {
      const response = await fetch("/api/user/account-manager-request")
      if (response.ok) {
        const data = await response.json()
        if (data.request) {
          setAccountManagerRequest(data.request)
        }
      }
    } catch (error) {
      console.error("Error fetching account manager request:", error)
    }
  }

  // Add this function to handle account manager request
  const handleRequestAccountManager = async () => {
    if (!session?.user?.id) return

    setRequestingManager(true)
    try {
      const response = await fetch("/api/user/account-manager-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          status: "requested",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to request account manager")
      }

      const data = await response.json()
      setAccountManagerRequest(data.request)

      toast({
        title: "Request Submitted",
        description: "Your dedicated account manager request has been submitted successfully.",
      })
    } catch (error) {
      console.error("Error requesting account manager:", error)
      toast({
        title: "Request Failed",
        description: "Failed to submit your account manager request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRequestingManager(false)
    }
  }

  // Add this function to fetch templates
  const fetchTemplates = async () => {
    try {
      // First try to fetch from user templates endpoint
      const response = await fetch("/api/user/templates")
      if (response.ok) {
        const data = await response.json()
        if (data.templates && Array.isArray(data.templates)) {
          // Map the templates to ensure they have the correct structure
          const mappedTemplates = data.templates.map((template: any) => ({
            id: template.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
            name: template.name || "Untitled Template",
            description: template.description || `${template.name} template`,
            category: template.category || "Document",
            price: template.price || 0,
            pricingTier: template.pricingTier || "Free",
            isPurchased: template.purchased || template.isPurchased || template.isFree || false,
            isPending: template.isPending || false,
            isFree: template.isFree || template.price === 0 || template.pricingTier === "Free",
            invoiceId: template.invoiceId || undefined,
            fileUrl: template.fileUrl || undefined,
            updatedAt: template.updatedAt || new Date().toISOString(),
            status: template.status || "active",
            usageCount: template.usageCount || 0,
          }))

          console.log("Fetched templates:", mappedTemplates)
          setTemplates(mappedTemplates)
        } else {
          // If no templates found or invalid format, try to fetch from admin templates
          await fetchTemplateStats()
        }
      } else {
        // If user templates endpoint fails, try admin endpoint
        await fetchTemplateStats()
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      // Try admin endpoint as fallback
      await fetchTemplateStats()
    }
  }

  // Function to fetch admin templates
  const fetchTemplateStats = async () => {
    try {
      const response = await fetch("/api/admin/templates")
      if (response.ok) {
        const data = await response.json()
        if (data.templates && data.templates.length > 0) {
          // Create template objects from the admin data
          const templatesFromAdmin = data.templates.map((template: any) => ({
            id: template.id,
            name: template.name,
            description: template.description || `${template.name} template`,
            category: template.category || "Document",
            price: template.price || 0,
            pricingTier: template.pricingTier || "Free",
            isPurchased: true, // Assume all templates from admin are accessible
            isPending: false,
            isFree: template.price === 0 || template.pricingTier === "Free",
            updatedAt: template.updatedAt || new Date().toISOString(),
            usageCount: template.usageCount || 0,
            status: template.status || "active",
            fileUrl: template.fileUrl,
          }))

          setTemplates(templatesFromAdmin)
        }
      }
    } catch (error) {
      console.error("Error fetching admin templates:", error)
    }
  }

  // Update the handleDownload function to use the existing download functionality
  const handleDownload = async (template: Template) => {
    try {
      toast({
        title: "Download started",
        description: "Preparing your document for download...",
      })

      if (!template.id) {
        throw new Error("No template information available for download")
      }

      // Increment user-specific download count
      await incrementUserDownloadCount(template.id)

      const apiUrl = `/api/user/templates/${template.id}/download`
      const apiResponse = await fetch(apiUrl)

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`)
      }

      const apiData = await apiResponse.json()

      if (!apiData.fileUrl) {
        throw new Error("No file URL returned from API")
      }

      const fileUrl = apiData.fileUrl
      const contentType = apiData.contentType || "application/octet-stream"
      const displayName = apiData.name || template.name

      let fileName = displayName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      const fileExtension = apiData.fileExtension || fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase()

      if (fileExtension) {
        fileName = `${fileName}.${fileExtension}`
      } else {
        fileName = `${fileName}.pdf`
      }

      // Create a server-side proxy request to avoid CORS issues and handle authentication
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&contentType=${encodeURIComponent(contentType)}&templateId=${template.id}`

      // Try multiple download methods for better compatibility
      try {
        const response = await fetch(proxyUrl)

        if (!response.ok) {
          throw new Error(`Proxy request failed: ${response.statusText}`)
        }

        const blob = await response.blob()

        if (blob.size === 0) {
          throw new Error("Downloaded file is empty")
        }

        // Create a blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl)
          document.body.removeChild(link)
        }, 100)

        toast({
          title: "Download complete",
          description: "Your document has been downloaded successfully.",
        })

        return
      } catch (method1Error) {
        console.error("Method 1 download failed:", method1Error)
        // Continue to method 2
      }

      // Method 2: Direct link with target="_blank" (fallback)
      window.open(
        `/api/direct-download?url=${encodeURIComponent(fileUrl)}&contentType=${encodeURIComponent(contentType)}&documentId=${template.id}&filename=${encodeURIComponent(fileName)}`,
        "_blank",
      )

      toast({
        title: "Download initiated",
        description: "Your document should open in a new tab. If it doesn't, please check your popup blocker settings.",
      })
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  // Find the fetchBusinessData function and update it to properly handle the annualReportDate
  // Replace the existing fetchBusinessData function with this updated version:

  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/user/business", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.business) {
          console.log("Fetched business data:", data.business) // Add logging to debug
          console.log("Annual report date:", data.business.annualReportDate) // Specifically log the date

          setBusinessData({
            name: data.business.name || "Your Business LLC",
            businessId: data.business.businessId || "Pending",
            formationDate: data.business.formationDate
              ? new Date(data.business.formationDate).toLocaleDateString()
              : "Pending",
            ein: data.business.ein || "Pending",
            serviceStatus: data.business.serviceStatus || "Pending",
            llcStatus: data.business.llcStatus || "In Progress",
            llcProgress: data.business.llcProgress || 0,
            llcStatusMessage: data.business.llcStatusMessage || "LLC formation initiated",
            annualReportFee: data.business.annualReportFee || 100,
            annualReportFrequency: data.business.annualReportFrequency || 1,
            annualReportDueDate: data.business.annualReportDueDate || "",
            annualReportDate: data.business.annualReportDate || "", // Ensure this is properly captured
          })
        }
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user invoices to get address information
  const fetchUserInvoices = async () => {
    try {
      const response = await fetch("/api/user/invoices")
      if (response.ok) {
        const data = await response.json()
        // We're not setting address from invoices anymore
        // Just keeping this function for other invoice data that might be needed
      }
    } catch (error) {
      console.error("Error fetching user invoices:", error)
    }
  }

  // Fetch phone number request status
  const fetchPhoneNumberRequest = async () => {
    try {
      const response = await fetch("/api/user/phone-request")
      if (response.ok) {
        const data = await response.json()
        if (data.request) {
          setPhoneNumberRequest(data.request)
        }
      }
    } catch (error) {
      console.error("Error fetching phone number request:", error)
    }
  }

  // Update the formatAddress function to use the userAddressData if available
  const formatAddress = (invoice: Invoice): string => {
    // If we have userAddressData, use that instead of invoice data
    if (userAddressData) {
      const parts = []

      if (userAddressData.addressLine1) parts.push(userAddressData.addressLine1)
      if (userAddressData.addressLine2) parts.push(userAddressData.addressLine2)

      let cityStateZip = ""
      if (userAddressData.city) cityStateZip += userAddressData.city
      if (userAddressData.state) cityStateZip += cityStateZip ? `, ${userAddressData.state}` : userAddressData.state
      if (userAddressData.zipCode)
        cityStateZip += cityStateZip ? ` ${userAddressData.zipCode}` : userAddressData.zipCode

      if (cityStateZip) parts.push(cityStateZip)
      if (userAddressData.country) parts.push(userAddressData.country)

      return parts.join(", ")
    }

    // Fall back to invoice data if no userAddressData
    const parts = []

    if (invoice.customerAddress) parts.push(invoice.customerAddress)

    let cityStateZip = ""
    if (invoice.customerCity) cityStateZip += invoice.customerCity
    if (invoice.customerState) cityStateZip += cityStateZip ? `, ${invoice.customerState}` : invoice.customerState
    if (invoice.customerZip) cityStateZip += cityStateZip ? ` ${invoice.customerZip}` : invoice.customerZip

    if (cityStateZip) parts.push(cityStateZip)
    if (invoice.customerCountry) parts.push(invoice.customerCountry)

    return parts.join(", ") || "100 Ambition Parkway, New York, NY 10001, USA" // Fallback to default
  }

  const handleRequestPhoneNumber = async () => {
    if (!session?.user?.id) return

    setRequestingPhone(true)
    try {
      const response = await fetch("/api/user/phone-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          status: "requested",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to request phone number")
      }

      const data = await response.json()
      setPhoneNumberRequest(data.request)

      toast({
        title: "Request Submitted",
        description: "Your US phone number request has been submitted successfully.",
      })
    } catch (error) {
      console.error("Error requesting phone number:", error)
      toast({
        title: "Request Failed",
        description: "Failed to submit your phone number request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRequestingPhone(false)
    }
  }

  const userName = session?.user?.name || "Client"

  // Function to determine the color of the progress bar
  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500"
    if (progress >= 70) return "bg-green-400"
    return "bg-blue-500"
  }

  // Function to determine the status icon
  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="h-5 w-5 text-green-500" />
    return null
  }

  // Function to copy text to clipboard
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

  // Now update the calculateAnnualReportDueDate function to properly handle the custom date
  // Replace the existing calculateAnnualReportDueDate function with this updated version:

  const calculateAnnualReportDueDate = () => {
    // If a custom annual report date is set, use that
    if (businessData.annualReportDate) {
      try {
        // Ensure we're parsing the date correctly
        const reportDate = new Date(businessData.annualReportDate)
        if (!isNaN(reportDate.getTime())) {
          return reportDate.toLocaleDateString()
        }
      } catch (error) {
        console.error("Error parsing annual report date:", error)
      }
    }

    // Fall back to calculation if no custom date or if parsing fails
    if (businessData.formationDate === "Pending") return "Pending"

    try {
      const formationDate = new Date(businessData.formationDate)
      const currentYear = new Date().getFullYear()

      // Calculate how many years have passed since formation
      const yearsSinceFormation = currentYear - formationDate.getFullYear()

      // Calculate how many reporting cycles have passed
      const cyclesPassed = Math.floor(yearsSinceFormation / businessData.annualReportFrequency)

      // Calculate the next due year
      const nextDueYear = formationDate.getFullYear() + (cyclesPassed + 1) * businessData.annualReportFrequency

      // Create the next due date (same month and day as formation)
      const nextDueDate = new Date(nextDueYear, formationDate.getMonth(), formationDate.getDate())

      return nextDueDate.toLocaleDateString()
    } catch (error) {
      console.error("Error calculating annual report due date:", error)
      return "Pending"
    }
  }

  // Function to calculate days remaining until annual report
  const calculateDaysRemaining = () => {
    // If a custom annual report date is set, use that
    if (businessData.annualReportDate) {
      const today = new Date()
      const dueDate = new Date(businessData.annualReportDate)

      // Calculate the difference in milliseconds
      const diffTime = dueDate.getTime() - today.getTime()

      // Convert to days and ensure it's not negative
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }

    if (businessData.formationDate === "Pending") return 365

    const today = new Date()
    const dueDate = new Date(calculateAnnualReportDueDate())

    // Calculate the difference in milliseconds
    const diffTime = dueDate.getTime() - today.getTime()

    // Convert to days and ensure it's not negative
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Function to calculate progress percentage for the progress bar
  const calculateProgressPercentage = () => {
    // If a custom annual report date is set, calculate based on that
    if (businessData.annualReportDate) {
      const today = new Date()
      const dueDate = new Date(businessData.annualReportDate)

      // Calculate total period as 1 year (365 days) in milliseconds
      const totalPeriod = 365 * 24 * 60 * 60 * 1000

      // Calculate time remaining until due date
      const timeRemaining = dueDate.getTime() - today.getTime()

      // Calculate percentage (100% means all time remaining, 0% means due date has passed)
      const percentage = (timeRemaining / totalPeriod) * 100

      // Ensure percentage is between 0 and 100
      return Math.min(100, Math.max(0, percentage))
    }

    if (businessData.formationDate === "Pending") return 50

    const formationDate = new Date(businessData.formationDate)
    const dueDate = new Date(calculateAnnualReportDueDate())
    const today = new Date()

    // Calculate total period length in milliseconds
    const totalPeriod = businessData.annualReportFrequency * 365 * 24 * 60 * 60 * 1000

    // Calculate elapsed time since last due date
    const lastDueDate = new Date(
      dueDate.getFullYear() - businessData.annualReportFrequency,
      dueDate.getMonth(),
      dueDate.getDate(),
    )

    const elapsedTime = today.getTime() - lastDueDate.getTime()

    // Calculate percentage (inverted, as we want to show remaining time)
    const percentage = 100 - (elapsedTime / totalPeriod) * 100

    // Ensure percentage is between 0 and 100
    return Math.min(100, Math.max(0, percentage))
  }

  // Function to render the phone number button based on request status
  const renderPhoneNumberButton = () => {
    if (!phoneNumberRequest) {
      return (
        <Button
          variant="outline"
          className="flex items-center justify-between p-6 h-auto w-full"
          onClick={handleRequestPhoneNumber}
          disabled={requestingPhone}
        >
          <div className="flex items-center">
            <Phone className="w-5 h-5 mr-2 text-[#22c984]" />
            <span className="text-base font-medium">
              {requestingPhone ? "Submitting request..." : "Claim your FREE US phone number"}
            </span>
          </div>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )
    }

    // If we have a phone number, show it with copy button
    if (phoneNumberRequest.phoneNumber) {
      return (
        <Button variant="outline" className="flex items-center justify-between p-6 h-auto w-full">
          <div className="flex items-center">
            <Phone className="w-5 h-5 mr-2 text-green-500" />
            <span className="text-base font-medium">Your US Phone Number: {phoneNumberRequest.phoneNumber}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(phoneNumberRequest.phoneNumber || "", "Phone number")}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </Button>
      )
    }

    // Otherwise show the status
    const statusText = {
      requested: "US phone number requested",
      pending: "US phone number request pending",
      approved: "US phone number approved (awaiting number)",
      rejected: "US phone number request rejected",
    }

    const statusClass = {
      requested: "text-blue-600 font-medium",
      pending: "text-yellow-600 font-medium",
      approved: "text-green-600 font-medium",
      rejected: "text-red-600 font-medium",
    }

    return (
      <Button variant="outline" className="flex items-center justify-between p-6 h-auto w-full" disabled>
        <div className="flex items-center">
          <Phone className={`w-5 h-5 mr-2 ${statusClass[phoneNumberRequest.status].replace("font-medium", "")}`} />
          <span className={`text-base ${statusClass[phoneNumberRequest.status]}`}>
            {statusText[phoneNumberRequest.status]}
          </span>
        </div>
      </Button>
    )
  }

  // Add this function to handle applying a coupon
  const handleApplyCoupon = (coupon: Coupon) => {
    // Store the coupon in localStorage
    localStorage.setItem("appliedCoupon", coupon.code)
    localStorage.setItem("couponData", JSON.stringify(coupon))

    toast({
      title: "Coupon applied",
      description: `${coupon.code} will be applied to your next purchase.`,
    })
  }

  // Add this function to handle copying a coupon code
  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)

    toast({
      title: "Coupon code copied",
      description: `${code} has been copied to your clipboard.`,
    })
  }

  // Function to render the account manager button based on request status
  const renderAccountManagerButton = () => {
    if (!accountManagerRequest) {
      return (
        <Button
          variant="outline"
          className="w-full justify-start h-auto py-4"
          onClick={handleRequestAccountManager}
          disabled={requestingManager}
        >
          <User className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-semibold">
              {requestingManager ? "Submitting request..." : "Request a dedicated Account Manager"}
            </p>
            <p className="text-sm text-gray-600 font-medium">Get personalized support for your business</p>
          </div>
        </Button>
      )
    }

    // If we have an assigned account manager, show contact button
    if (accountManagerRequest.status === "approved" && accountManagerRequest.managerName) {
      return (
        <Button
          variant="outline"
          className="w-full justify-start h-auto py-4"
          onClick={() => {
            if (accountManagerRequest.contactLink) {
              window.open(accountManagerRequest.contactLink, "_blank")
            }
          }}
        >
          <User className="w-5 h-5 mr-3 text-green-500" />
          <div className="text-left">
            <p className="font-semibold">Contact Account Manager</p>
            <p className="text-sm text-gray-600 font-medium">
              {accountManagerRequest.managerName} is your Orizen account manager
            </p>
          </div>
        </Button>
      )
    }

    // Otherwise show the status
    const statusText = {
      requested: "Dedicated Account Manager Requested",
      pending: "Account Manager Request Pending",
      approved: "Account Manager Request Approved",
      rejected: "Account Manager Request Rejected",
    }

    const statusClass = {
      requested: "text-blue-600",
      pending: "text-yellow-600",
      approved: "text-green-600",
      rejected: "text-red-600",
    }

    return (
      <Button variant="outline" className="w-full justify-start h-auto py-4" disabled>
        <User className={`w-5 h-5 mr-3 ${statusClass[accountManagerRequest.status]}`} />
        <div className="text-left">
          <p className="font-semibold">{statusText[accountManagerRequest.status]}</p>
          <p className="text-sm text-gray-600 font-medium">We'll process your request soon</p>
        </div>
      </Button>
    )
  }

  // Filter templates based on purchase status
  const templatesForDashboard = templates.filter((t) => t.isPurchased || t.isFree).slice(0, 5) // Limit to 5 templates for dashboard display

  // Add a helper function to format currency
  const formatCurrency = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00"
    const numAmount = typeof amount === "number" ? amount : Number(amount)
    if (isNaN(numAmount)) return "$0.00"
    return `$${numAmount.toFixed(2)}`
  }

  // Add a helper function to calculate days left
  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to get status badge
  const getStatusBadge = (status: Amendment["status"]) => {
    const statusConfig = {
      pending: { bg: "bg-blue-100", text: "text-blue-800", label: "Pending" },
      in_review: { bg: "bg-purple-100", text: "text-purple-800", label: "In Review" },
      waiting_for_payment: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Payment Required" },
      payment_confirmation_pending: { bg: "bg-blue-100", text: "text-blue-800", label: "Payment Verification Pending" },
      payment_received: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Payment Received" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      amendment_in_progress: { bg: "bg-purple-100", text: "text-purple-800", label: "Amendment In Progress" },
      amendment_resolved: { bg: "bg-green-100", text: "text-green-800", label: "Amendment Resolved" },
      closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
    }

    const config = statusConfig[status]

    return (
      <span className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  // Helper function to get status icon
  const getAmendmentStatusIcon = (status: Amendment["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "in_review":
        return <FileText className="h-5 w-5 text-purple-500" />
      case "waiting_for_payment":
        return <DollarSign className="h-5 w-5 text-yellow-500" />
      case "payment_confirmation_pending":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-indigo-500" />
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "amendment_in_progress":
        return <PenTool className="h-5 w-5 text-purple-500" />
      case "amendment_resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "closed":
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return <DashboardLoader />
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 sm:mb-40 overflow-x-hidden pt-6 sm:pt-22">
      <AnimationStyles />
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Hello, {userName}</h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          All of us at Orizen wish you great success with {businessData.name}
        </p>
      </div>

      {/* Business Information Cards - 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Flag className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm font-medium text-gray-600">Business Name</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.name, "Business name")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.name}</p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm font-medium text-gray-600">Business ID</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.businessId, "Business ID")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.businessId}</p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Hash className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm font-medium text-gray-600">EIN</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.ein, "EIN")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.ein}</p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm font-medium text-gray-600">Service Status</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(businessData.serviceStatus, "Service status")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                businessData.serviceStatus === "Approved"
                  ? "bg-green-500"
                  : businessData.serviceStatus === "Pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              } mr-2`}
            ></div>
            <p className="text-lg font-semibold">{businessData.serviceStatus}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm font-medium text-gray-600">Formation Date</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(businessData.formationDate, "Formation date")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.formationDate}</p>
        </Card>
      </div>

      {/* LLC Status Card */}
      <Card className="mb-4 sm:mb-8 p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-[#22c984] mr-2" />
            <span className="text-sm font-medium text-gray-600">LLC Status</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(businessData.llcStatusMessage, "LLC status")}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <div className="mb-2 flex items-center">
          <p className="text-lg font-semibold mr-2">{businessData.llcStatusMessage}</p>
          {getStatusIcon(businessData.llcProgress)}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor(businessData.llcProgress)} rounded-full`}
            style={{ width: `${businessData.llcProgress}%` }}
          ></div>
        </div>
        <p className="text-sm font-medium text-gray-600 mt-1">{businessData.llcProgress}% Complete</p>
      </Card>

      {/* Annual Report Card */}
      <Card className="mb-4 sm:mb-8 p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Annual Report Due</div>
            <div className="text-lg font-semibold">
              {businessData.formationDate !== "Pending" ? calculateAnnualReportDueDate() : "Pending"}
            </div>
            <div className="text-sm font-medium text-gray-600 mt-1">Fee: ${businessData.annualReportFee}</div>
          </div>
          <div className="text-right">
            <div
              className={`text-sm font-medium ${calculateDaysRemaining() <= 30 ? "text-red-600 animate-pulse" : "text-gray-600"} mb-1`}
            >
              {calculateDaysRemaining()} days left
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  calculateDaysRemaining() <= 30 ? "bg-red-500 animate-pulse-subtle" : "bg-[#22c984]"
                }`}
                style={{ width: `${calculateProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Address Section - Now with proper heading */}
      <Card className="mb-4 sm:mb-8 p-3 sm:p-4 md:p-6">
        <div className="flex items-center mb-4">
          <Building2 className="w-5 h-5 text-[#22c984] mr-2" />
          <span className="text-sm font-medium text-gray-600">USA Business Address</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-lg font-medium">
            {userAddressData
              ? `${userAddressData.addressLine1}${userAddressData.addressLine2 ? `, ${userAddressData.addressLine2}` : ""}, ${userAddressData.city}, ${userAddressData.state} ${userAddressData.zipCode}, ${userAddressData.country}`
              : "100 Ambition Parkway, New York, NY 10001, USA"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              copyToClipboard(
                userAddressData
                  ? `${userAddressData.addressLine1}${userAddressData.addressLine2 ? `, ${userAddressData.addressLine2}` : ""}, ${userAddressData.city}, ${userAddressData.state} ${userAddressData.zipCode}, ${userAddressData.country}`
                  : "100 Ambition Parkway, New York, NY 10001, USA",
                "Address",
              )
            }
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Action Buttons - Removed logo button, updated phone button */}
      <div className="mb-8 overflow-x-auto">
        <div className="min-w-[600px] md:min-w-0">{renderPhoneNumberButton()}</div>
      </div>

      {/* Amendments and Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        {/* Amendments Card */}
        <Card>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Status of My Amendments</h2>
            <Link href="/dashboard/compliance/amendments" passHref>
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span>View All</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="p-6">
            {amendmentsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : amendments.length > 0 ? (
              <div className="space-y-4">
                {amendments.slice(0, 2).map((amendment) => (
                  <div key={amendment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getAmendmentStatusIcon(amendment.status)}
                        <div>
                          <p className="font-medium">{amendment.type}</p>
                          <p className="text-xs text-gray-600">
                            Submitted: {new Date(amendment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(amendment.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{amendment.details}</p>
                    {amendment.status === "waiting_for_payment" && amendment.paymentAmount && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Payment Required:</p>
                          <p className="font-bold">{formatCurrency(amendment.paymentAmount)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No amendments found</p>
                <Link href="/dashboard/compliance/amendments" passHref>
                  <Button variant="default">Submit Amendment</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Deadlines Card */}
        <Card>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
            <Link href="/dashboard/compliance/annual-reports" passHref>
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span>View All</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="p-6">
            {deadlinesLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 2).map((deadline) => {
                  const daysLeft = calculateDaysLeft(deadline.dueDate)
                  const isUrgent = daysLeft <= 30
                  const isPending = deadline.status === "pending"

                  return (
                    <div key={deadline.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {isUrgent ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CalendarIcon className="h-5 w-5 text-[#22c984]" />
                          )}
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            <p className="text-xs text-gray-600">
                              Due: {new Date(deadline.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                            isUrgent ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {daysLeft} days left
                        </span>
                      </div>
                      {deadline.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deadline.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Fee: ${Number(deadline.fee).toFixed(2)}</p>
                        {isPending && (
                          <Link href="/dashboard/compliance/annual-reports" passHref>
                            <Button size="sm" variant="outline">
                              File Now
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming deadlines at this time</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Documents Section - Updated to show templates */}
      <Card className="mb-4 sm:mb-8">
        <div className="p-3 sm:p-6 border-b flex flex-wrap justify-between items-center">
          <h2 className="text-xl font-semibold">Docs</h2>
        </div>
        <div className="p-3 sm:p-6 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pb-4 font-medium">Template Name</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium relative group">
                  Your Downloads
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs rounded p-2 w-48 z-10">
                    Number of times you have downloaded this template
                  </div>
                </th>
                <th className="pb-4 font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templatesForDashboard.length > 0 ? (
                templatesForDashboard.map((template) => (
                  <tr key={template.id}>
                    <td className="py-4 font-medium">{template.name}</td>
                    <td className="py-4">{new Date(template.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className="font-medium">{userDownloadCounts[template.id] || 0}</span>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(template)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No documents available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* See more templates button */}
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard/documents/templates" passHref>
              <Button variant="outline" className="flex items-center gap-2">
                <span>See more templates</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* My Tickets Section */}
      <Card className="mb-4 sm:mb-8">
        <div className="p-3 sm:p-6 border-b flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-xl font-semibold">My Tickets</h2>
          <Link href="/dashboard/tickets" passHref>
            <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <span>View All</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="p-3 sm:p-6 overflow-x-auto">
          {ticketsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : tickets.length > 0 ? (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pb-4 font-medium">Ticket Subject</th>
                  <th className="pb-4 font-medium">Ticket ID</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Priority</th>
                  <th className="pb-4 font-medium">Category</th>
                  <th className="pb-4 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.slice(0, 3).map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="py-4 font-medium">{ticket.subject}</td>
                    <td className="py-4">{ticket.id.substring(0, 8)}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "open"
                            ? "bg-green-100 text-green-800"
                            : ticket.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : ticket.priority === "medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">{ticket.category}</td>
                    <td className="py-4">{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any support tickets yet</p>
              <Link href="/dashboard/tickets/new" passHref>
                <Button variant="default">Create a Ticket</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Help Section with Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <SpendingAnalytics />
        </div>

        <div className="space-y-6">
          {/* Coupons Card */}
          <Card>
            <div className="p-3 sm:p-6 border-b flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-xl font-semibold">My Top Coupon</h2>
              <Link href="/dashboard/coupons" passHref>
                <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span>View All</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="p-6">
              {couponsLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : coupons.length > 0 ? (
                <div className="space-y-4">
                  {/* Show top 2 coupons by value */}
                  {[...coupons]
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 1)
                    .map((coupon) => {
                      const daysUntilExpiry = Math.ceil(
                        (new Date(coupon.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )
                      const isExpiringSoon = daysUntilExpiry <= 7

                      return (
                        <div
                          key={coupon.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-lg">{coupon.code}</p>
                              <p className="text-sm text-gray-600">{coupon.description}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                              <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                              <p className="text-lg font-bold">{formatCouponValue(coupon.type, coupon.value)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expires</p>
                              <p
                                className={`text-sm font-medium ${isExpiringSoon ? "text-red-600 dark:text-red-400" : ""}`}
                              >
                                {new Date(coupon.expiresAt).toLocaleDateString()}
                                {isExpiringSoon && ` (${daysUntilExpiry} days left)`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              style={{ backgroundColor: "#22C984", borderColor: "#22C984" }}
                              onClick={() => handleApplyCoupon(coupon)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">You don't have any available coupons</p>
                  <Link href="/dashboard/coupons" passHref>
                    <Button variant="outline">Browse Coupons</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Need Help Card */}
          <Card>
            <div className="p-3 sm:p-6">
              <h3 className="text-2xl font-bold mb-6">Need help?</h3>
              <div className="space-y-4">
                {/* Replace the Contact account manager button with our new dynamic button */}
                {session?.user?.id && <AccountManagerRequest userId={session.user.id} />}

                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-semibold">Create a ticket</p>
                    <p className="text-sm text-gray-600 font-medium whitespace-normal leading-tight">
                      Our support team is always here for you.
                    </p>
                  </div>
                </Button>

                <ContactPopup />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

