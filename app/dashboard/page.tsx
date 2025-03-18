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
} from "lucide-react"
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
  })
  const [userAddress, setUserAddress] = useState({
    address: "100 Ambition Parkway, New York, NY 10001, USA", // Default address
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
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)

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

  // Add fetchTickets to the useEffect that runs when session is available
  // Find the useEffect that includes fetchBusinessData and add fetchTickets
  // Modify the useEffect to include fetchTickets:
  useEffect(() => {
    if (session) {
      fetchBusinessData()
      fetchUserInvoices()
      fetchPhoneNumberRequest()
      fetchAccountManagerRequest()
      fetchTemplates()
      fetchUserDownloadCounts()
      fetchTickets() // Add this line
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
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates)
        } else {
          // If no templates found, try to fetch from admin templates
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

  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/user/business")
      if (response.ok) {
        const data = await response.json()
        if (data.business) {
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
      // We'll need to create a new API endpoint to fetch user's invoices
      const response = await fetch("/api/user/invoices")
      if (response.ok) {
        const data = await response.json()
        if (data.invoices && data.invoices.length > 0) {
          // Get the most recent invoice with address information
          const invoicesWithAddress = data.invoices.filter(
            (invoice: Invoice) => invoice.customerAddress && invoice.customerCity,
          )

          if (invoicesWithAddress.length > 0) {
            // Sort by date (newest first) and get the first one
            const latestInvoice = invoicesWithAddress.sort(
              (a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0]

            // Format the address
            const formattedAddress = formatAddress(latestInvoice)

            setUserAddress({
              address: formattedAddress,
              customerAddress: latestInvoice.customerAddress || "",
              customerCity: latestInvoice.customerCity || "",
              customerState: latestInvoice.customerState || "",
              customerZip: latestInvoice.customerZip || "",
              customerCountry: latestInvoice.customerCountry || "",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user invoices:", error)
      // Keep the default address if there's an error
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

  // Format address from invoice data
  const formatAddress = (invoice: Invoice): string => {
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

  // Function to calculate the annual report due date
  const calculateAnnualReportDueDate = () => {
    if (businessData.formationDate === "Pending") return "Pending"

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
  }

  // Function to calculate days remaining until annual report
  const calculateDaysRemaining = () => {
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
  const hasPurchasedTemplates = templates.some((t) => t.isPurchased && !t.isFree)

  // Get templates to display in the dashboard
  const templatesForDashboard = hasPurchasedTemplates
    ? templates.filter((t) => t.isPurchased && !t.isFree) // Show purchased non-free templates
    : templates.filter((t) => t.isFree) // Show only free templates if no purchases

  if (loading) {
    return <DashboardLoader />
  }

  return (
    <div className="p-8 mb-40">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Hello, {userName}</h1>
        <p className="text-gray-600 text-lg">All of us at Orizen wish you great success with {businessData.name}</p>
      </div>

      {/* Business Information Cards - 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
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

        <Card className="p-6">
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

        <Card className="p-6">
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

        <Card className="p-6">
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

        <Card className="p-6">
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
      <Card className="mb-8 p-6">
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
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Annual Report Due</div>
            <div className="text-lg font-semibold">
              {businessData.formationDate !== "Pending" ? calculateAnnualReportDueDate() : "Pending"}
            </div>
            <div className="text-sm font-medium text-gray-600 mt-1">
              Fee: ${businessData.annualReportFee} (Every {businessData.annualReportFrequency}{" "}
              {businessData.annualReportFrequency === 1 ? "year" : "years"})
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-600 mb-1">{calculateDaysRemaining()} days left</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22c984] rounded-full"
                style={{ width: `${calculateProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Address Section - Now using the address from invoices */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-medium">{userAddress.address}</p>
          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userAddress.address, "Address")}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Action Buttons - Removed logo button, updated phone button */}
      <div className="mb-8">{renderPhoneNumberButton()}</div>

      {/* Documents Section - Updated to show templates */}
      <Card className="mb-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Docs</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
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
                <>
                  <tr>
                    <td className="py-4 font-medium">Company documents</td>
                    <td className="py-4">28 Mar 2024</td>
                    <td className="py-4">
                      <span className="font-medium">24</span>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Scanned mail</td>
                    <td className="py-4">04 Apr 2024</td>
                    <td className="py-4">
                      <span className="font-medium">18</span>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Scanned mail</td>
                    <td className="py-4">24 May 2024</td>
                    <td className="py-4">
                      <span className="font-medium">32</span>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </>
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
      <Card className="mb-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Tickets</h2>
          <Link href="/dashboard/tickets" passHref>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <span>View All</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="p-6">
          {ticketsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : tickets.length > 0 ? (
            <table className="w-full">
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

      {/* Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SpendingAnalytics />
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-6">Need help?</h3>
            <div className="space-y-4">
              {/* Replace the Contact account manager button with our new dynamic button */}
              {session?.user?.id && <AccountManagerRequest userId={session.user.id} />}

              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <MessageSquare className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Create a ticket</p>
                  <p className="text-sm text-gray-600 font-medium">Our support team is always here for you.</p>
                </div>
              </Button>

              <ContactPopup />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

