"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Flag,
  Building2,
  Hash,
  Bell,
  FileText,
  Phone,
  Eye,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  Copy,
  Download,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

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
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requestingPhone, setRequestingPhone] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
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

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchBusinessData()
      fetchUserInvoices()
      fetchPhoneNumberRequest()
      fetchTemplates() // Add this to fetch templates
    } else {
      setLoading(false)
    }
  }, [session])

  // Add this function to fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/user/templates")
      if (response.ok) {
        const data = await response.json()
        if (data.templates) {
          setTemplates(data.templates)
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  // Add this function to handle template download
  const handleDownload = async (template: Template) => {
    try {
      toast({
        title: "Download started",
        description: "Preparing your document for download...",
      })

      if (!template.id) {
        throw new Error("No template information available for download")
      }

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

      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&contentType=${encodeURIComponent(contentType)}&templateId=${template.id}`

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 100)

      toast({
        title: "Download complete",
        description: "Your document has been downloaded successfully.",
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

  // Filter templates based on purchase status
  const hasPurchasedTemplates = templates.some((t) => t.isPurchased && !t.isFree)

  // Get templates to display in the dashboard
  const templatesForDashboard = hasPurchasedTemplates
    ? templates.filter((t) => t.isPurchased && !t.isFree) // Show purchased non-free templates
    : templates.filter((t) => t.isFree) // Show only free templates if no purchases

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
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
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Docs</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pb-4 font-medium">Template Name</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">View</th>
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
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(template)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Scanned mail</td>
                    <td className="py-4">04 Apr 2024</td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Scanned mail</td>
                    <td className="py-4">24 May 2024</td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">Get $20</h3>
            <p className="mb-6 text-base font-medium">
              Earn rewards by referring your friends to experience our services. Unlock exclusive benefits when you
              partner with Orizen!
            </p>
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 font-medium">
              Claim
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-6">Need help?</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <User className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Contact account manager</p>
                  <p className="text-sm text-gray-600 font-medium">Steve is your Orizen account manager.</p>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <MessageSquare className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Create a ticket</p>
                  <p className="text-sm text-gray-600 font-medium">Our support team is always here for you.</p>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Read our Helpdesk articles</p>
                  <p className="text-sm text-gray-600 font-medium">We have content that you might be interested in.</p>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

