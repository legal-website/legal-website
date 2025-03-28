"use client"

import { useState, useEffect } from "react"
import { TemplateUnlockNotification } from "@/components/template-unlock-notification"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Upload,
  Clock,
  CheckCircle,
  RefreshCw,
  Lock,
  Unlock,
  Gift,
  FileIcon as FileWord,
  FileIcon as FilePdf,
  FileSpreadsheetIcon,
  FileIcon as FilePresentationIcon,
  ImageIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

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

interface UnlockingStatus {
  isUnlocking: boolean
  templateName: string
  progress: number
  effectClass?: string
}

export default function DocumentTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"name" | "price" | "category" | "newest" | "oldest">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [priceFilter, setPriceFilter] = useState<"all" | "highest" | "lowest">("all")
  const itemsPerPage = 12

  // Add state for tracking unlocking status
  const [unlockingStatus, setUnlockingStatus] = useState<UnlockingStatus | null>(null)

  // Check for recently approved payments - only on initial load, not auto-refresh
  useEffect(() => {
    const checkRecentApprovals = async () => {
      if (!session) return

      try {
        const response = await fetch("/api/user/templates/recent-approvals")
        if (response.ok) {
          const data = await response.json()
          if (data.recentApprovals && data.recentApprovals.length > 0) {
            const approval = data.recentApprovals[0]
            simulateUnlocking(approval.templateName)
          }
        }
      } catch (error) {
        console.error("Error checking recent approvals:", error)
      }
    }

    checkRecentApprovals()
  }, [session])

  // Function to simulate the unlocking process with a progress bar
  const simulateUnlocking = (templateName: string) => {
    setUnlockingStatus({
      isUnlocking: true,
      templateName,
      progress: 0,
    })

    // Calculate steps for a 3-minute progress (180 seconds)
    // We'll update every 2 seconds, so 90 steps total
    const totalSteps = 90
    const stepSize = 100 / totalSteps
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const progress = Math.min(currentStep * stepSize, 100)

      // Add different effects based on progress
      let effectClass = "bg-blue-500"
      if (progress > 75) {
        effectClass = "bg-green-500"
      } else if (progress > 50) {
        effectClass = "bg-teal-500"
      } else if (progress > 25) {
        effectClass = "bg-cyan-500"
      }

      setUnlockingStatus((prev) => (prev ? { ...prev, progress, effectClass } : null))

      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setUnlockingStatus(null)
          fetchTemplates() // Refresh templates after unlocking
        }, 1000)
      }
    }, 2000) // Update every 2 seconds for a total of 3 minutes
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (session) {
      fetchTemplates()
    }
  }, [session])

  // Reset to page 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true)
    fetchTemplates().finally(() => {
      setRefreshing(false)
      toast({
        title: "Refreshed",
        description: "Template list has been updated.",
      })
    })
  }

  // Update the getFileIcon function to be more specific with file types
  const getFileIcon = (fileUrl: string | undefined) => {
    if (!fileUrl) return <FileText className="h-5 w-5 text-blue-600" />

    const extension = fileUrl.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FilePdf className="h-5 w-5 text-red-600" />
      case "doc":
      case "docx":
        return <FileWord className="h-5 w-5 text-blue-600" />
      case "xls":
      case "xlsx":
        return <FileSpreadsheetIcon className="h-5 w-5 text-green-600" />
      case "ppt":
      case "pptx":
        return <FilePresentationIcon className="h-5 w-5 text-orange-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-blue-600" />
    }
  }

  // Add this function before the return statement
  const getPricingTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Free":
        return "bg-gray-100 hover:bg-gray-200 text-gray-800"
      case "Basic":
        return "bg-blue-100 hover:bg-blue-200 text-blue-800"
      case "Standard":
        return "bg-purple-100 hover:bg-purple-200 text-purple-800"
      case "Premium":
        return "bg-amber-100 hover:bg-amber-200 text-amber-800"
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800"
    }
  }

  // Update the fetchTemplates function to handle the updated template access
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/templates")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      console.log("Templates data:", data) // Debug log

      // If templates is empty, create some mock data for testing
      if (!data.templates || data.templates.length === 0) {
        const mockTemplates: Template[] = [
          {
            id: "1",
            name: "LLC Formation",
            description: "Complete LLC formation document package",
            category: "Business Formation",
            price: 49.99,
            pricingTier: "Standard",
            isPurchased: false,
            isPending: false,
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Employment Agreement",
            description: "Standard employment agreement template",
            category: "Contracts",
            price: 29.99,
            pricingTier: "Basic",
            isPurchased: false,
            isPending: false,
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Privacy Policy",
            description: "Website privacy policy template",
            category: "Compliance",
            price: 0,
            pricingTier: "Free",
            isPurchased: true,
            isPending: false,
            isFree: true,
            updatedAt: new Date().toISOString(),
          },
        ]
        setTemplates(mockTemplates)
      } else {
        // Map the templates from the API to match our interface
        interface ApiTemplate {
          id: string
          name: string
          description?: string
          category?: string
          price?: number
          pricingTier?: string
          purchased?: boolean
          isPending?: boolean
          isFree?: boolean
          invoiceId?: string
          fileUrl?: string
          updatedAt?: string
          status?: string
          usageCount?: number
        }

        const mappedTemplates = data.templates.map((template: ApiTemplate) => ({
          id: template.id,
          name: template.name,
          description: template.description || `${template.name} template`,
          category: template.category || "Uncategorized",
          price: template.price || 0,
          pricingTier: template.pricingTier || "Free",
          isPurchased: template.purchased || false,
          isPending: template.isPending || false,
          isFree: template.isFree || template.price === 0 || template.pricingTier === "Free",
          invoiceId: template.invoiceId || undefined,
          fileUrl: template.fileUrl || undefined,
          updatedAt: template.updatedAt || new Date().toISOString(),
          status: template.status || "active",
          usageCount: template.usageCount || 0,
        })) as Template[]
        setTemplates(mappedTemplates)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      })

      // Set mock data for testing if API fails
      const mockTemplates = [
        {
          id: "1",
          name: "LLC Formation",
          description: "Complete LLC formation document package",
          category: "Business Formation",
          price: 49.99,
          pricingTier: "Standard",
          isPurchased: false,
          isPending: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Employment Agreement",
          description: "Standard employment agreement template",
          category: "Contracts",
          price: 29.99,
          pricingTier: "Basic",
          isPurchased: false,
          isPending: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Privacy Policy",
          description: "Website privacy policy template",
          category: "Compliance",
          price: 0,
          pricingTier: "Free",
          isPurchased: true,
          isPending: false,
          isFree: true,
          updatedAt: new Date().toISOString(),
        },
      ]
      setTemplates(mockTemplates)
    } finally {
      setLoading(false)
    }
  }

  const categories = ["All", ...new Set(templates.map((template) => template.category))]

  // Get counts for tabs
  const allTemplatesCount = templates.length
  const unlockedTemplatesCount = templates.filter((t) => t.isPurchased).length
  const lockedTemplatesCount = templates.filter((t) => !t.isPurchased && !t.isFree).length
  const freeTemplatesCount = templates.filter((t) => t.isFree).length

  // Filter templates based on active tab
  const tabFilteredTemplates = templates.filter((template) => {
    if (activeTab === "all") return true
    if (activeTab === "unlocked") return template.isPurchased
    if (activeTab === "locked") return !template.isPurchased && !template.isPending && !template.isFree
    if (activeTab === "free") return template.isFree
    return true
  })

  const filteredTemplates = tabFilteredTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory

    // Apply price filter
    let matchesPrice = true
    if (priceFilter === "highest") {
      // Get the highest price template
      const highestPrice = Math.max(...templates.map((t) => t.price))
      matchesPrice = template.price === highestPrice
    } else if (priceFilter === "lowest") {
      // Get the lowest price template (excluding free templates)
      const lowestPrice = Math.min(...templates.filter((t) => t.price > 0).map((t) => t.price))
      matchesPrice = template.price === lowestPrice
    }

    return matchesSearch && matchesCategory && matchesPrice
  })

  // Apply sorting to filtered templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortBy === "price") {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price
    } else if (sortBy === "category") {
      return sortOrder === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
    } else if (sortBy === "newest") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    } else if (sortBy === "oldest") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    }
    return 0
  })

  // Pagination logic
  const indexOfLastTemplate = currentPage * itemsPerPage
  const indexOfFirstTemplate = indexOfLastTemplate - itemsPerPage
  const currentTemplates = sortedTemplates.slice(indexOfFirstTemplate, indexOfLastTemplate)
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage)

  const handlePurchase = async (template: Template) => {
    try {
      if (!session) {
        router.push("/login?callbackUrl=/dashboard/documents/templates")
        return
      }

      // Log the template price to verify it's correct
      console.log(`Purchasing template: ${template.name} with price: $${template.price}`)

      const response = await fetch("/api/user/templates/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          price: template.price, // Explicitly send the price to ensure it's used
          type: "template", // Explicitly mark this as a template purchase
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to purchase template")
      }

      const data = await response.json()
      console.log("Purchase response:", data) // Debug log

      // Update the template in the local state
      setTemplates((prevTemplates) =>
        prevTemplates.map((t) => (t.id === template.id ? { ...t, isPending: true, invoiceId: data.invoice.id } : t)),
      )

      setSelectedInvoice(data.invoice)
      setSelectedTemplate(template)
      setShowUploadDialog(true)

      toast({
        title: "Purchase initiated",
        description: "Please upload your payment receipt to complete the purchase.",
      })
    } catch (error) {
      console.error("Error purchasing template:", error)
      toast({
        title: "Error",
        description: "Failed to purchase template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUploadReceipt = async () => {
    if (!uploadFile || !selectedInvoice || !selectedTemplate) return

    try {
      setUploading(true)

      // Log what we're sending for debugging
      console.log("Uploading receipt for template:", {
        templateName: selectedTemplate.name,
        templateId: selectedTemplate.id,
        price: selectedTemplate.price,
      })

      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("invoiceId", selectedInvoice.id)
      formData.append("isTemplateInvoice", "true")
      formData.append("templateName", selectedTemplate.name) // Ensure template name is included
      formData.append("templateId", selectedTemplate.id)
      formData.append("price", selectedTemplate.price.toString())

      const response = await fetch("/api/user/templates/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Upload receipt error:", errorData)
        throw new Error(errorData.error || "Failed to upload receipt")
      }

      const responseData = await response.json()
      console.log("Upload receipt response:", responseData)

      toast({
        title: "Receipt uploaded",
        description: "Your receipt has been uploaded and is pending approval.",
      })

      setShowUploadDialog(false)
      setUploadFile(null)
      fetchTemplates() // Refresh templates
    } catch (error) {
      console.error("Error uploading receipt:", error)
      toast({
        title: "Error",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Replace the handleDownload function with this improved version
  const handleDownload = async (template: Template) => {
    try {
      // Show loading state
      toast({
        title: "Download started",
        description: "Preparing your document for download...",
      })

      // If template has no ID or fileUrl, we can't proceed
      if (!template.id && !template.fileUrl) {
        throw new Error("No template information available for download")
      }

      // First try to get the file through our API to handle authentication and tracking
      const apiUrl = `/api/user/templates/${template.id}/download`
      const apiResponse = await fetch(apiUrl)

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`)
      }

      const apiData = await apiResponse.json()

      if (!apiData.fileUrl) {
        throw new Error("No file URL returned from API")
      }

      // Get file details from API response
      const fileUrl = apiData.fileUrl
      const contentType = apiData.contentType || "application/octet-stream"
      const displayName = apiData.name || template.name

      // Create a sanitized filename with the correct extension
      let fileName = displayName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      const fileExtension = apiData.fileExtension || fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase()

      if (fileExtension) {
        fileName = `${fileName}.${fileExtension}`
      } else {
        // Default to PDF if no extension is found
        fileName = `${fileName}.pdf`
      }

      console.log(`Downloading file: ${fileName} (${contentType}) from ${fileUrl}`)

      // Create a server-side proxy request to avoid CORS issues and handle authentication
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&contentType=${encodeURIComponent(contentType)}&templateId=${template.id}`

      // Try multiple download methods for better compatibility

      // Method 1: Fetch and create blob URL (most reliable)
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
      try {
        const link = document.createElement("a")
        link.href = proxyUrl
        link.target = "_blank" // Open in new tab
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)

        toast({
          title: "Download initiated",
          description:
            "Your document should open in a new tab. If it doesn't, please check your popup blocker settings.",
        })

        return
      } catch (method2Error) {
        console.error("Method 2 download failed:", method2Error)
        // Continue to method 3
      }

      // Method 3: iframe approach (last resort)
      try {
        const iframe = document.createElement("iframe")
        iframe.style.display = "none"
        iframe.src = proxyUrl
        document.body.appendChild(iframe)

        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 5000)

        toast({
          title: "Download initiated",
          description: "Your document should download automatically. If it doesn't, please try again.",
        })
      } catch (method3Error) {
        console.error("Method 3 download failed:", method3Error)
        throw new Error("All download methods failed")
      }
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  const [recentApprovals, setRecentApprovals] = useState<any[]>([])

  const handleUnlockComplete = () => {
    setRecentApprovals([])
    fetchTemplates() // Refresh templates after unlock
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Document Templates</h1>

      <Card className="mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Premium Templates</h2>
              {recentApprovals.length > 0 && (
                <TemplateUnlockNotification
                  templateName={recentApprovals[0].templateName}
                  onComplete={handleUnlockComplete}
                />
              )}

              {/* Unlocking Progress Notification */}
              {unlockingStatus && unlockingStatus.isUnlocking && (
                <div className="mt-2 bg-green-50 border border-green-100 rounded-md p-3 max-w-md">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">
                      Payment approved. <span className="font-medium">{unlockingStatus.templateName}</span> is being
                      unlocked.
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${unlockingStatus.effectClass || "bg-blue-500"} rounded-full transition-all duration-300 ease-in-out`}
                      style={{ width: `${unlockingStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm">Sort by:</span>
                <select
                  className="px-2 py-1 border rounded-md text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="category">Category</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Price:</span>
                <select
                  className="px-2 py-1 border rounded-md text-sm"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as any)}
                >
                  <option value="all">All Prices</option>
                  <option value="highest">Highest Price</option>
                  <option value="lowest">Lowest Price</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Order:</span>
                <select
                  className="px-2 py-1 border rounded-md text-sm"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Template Tabs */}
        <div className="px-6 pt-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                All Templates
                <Badge variant="secondary" className="ml-1">
                  {allTemplatesCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="free" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Free Templates
                <Badge variant="secondary" className="ml-1">
                  {freeTemplatesCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                Unlocked Templates
                <Badge variant="secondary" className="ml-1">
                  {unlockedTemplatesCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="locked" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Locked Templates
                <Badge variant="secondary" className="ml-1">
                  {lockedTemplatesCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {/* Search and filters remain in all tabs */}
              <div className="border-b pb-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search templates..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length > 0 ? (
                  currentTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">{getFileIcon(template.fileUrl)}</div>
                          <Badge className={getPricingTierBadgeColor(template.pricingTier)}>
                            {template.pricingTier}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                          <span className="text-sm font-medium">${template.price.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end">
                          {template.isPurchased || template.isFree ? (
                            <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </Button>
                          ) : template.isPending ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template)
                                // Fetch invoice details
                                fetch(`/api/invoices/${template.invoiceId}`)
                                  .then((res) => res.json())
                                  .then((data) => {
                                    setSelectedInvoice(data.invoice)
                                    setShowUploadDialog(true)
                                  })
                              }}
                            >
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              Upload Receipt
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handlePurchase(template)}>
                              <Lock className="h-3.5 w-3.5 mr-1.5" />
                              Unlock ${template.price}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="free" className="mt-0">
              {/* Search and filters for free tab */}
              <div className="border-b pb-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search free templates..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Grid for free templates */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length > 0 ? (
                  currentTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">{getFileIcon(template.fileUrl)}</div>
                          <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800">Free</Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                          <span className="text-sm font-medium">$0.00</span>
                        </div>

                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No free templates found</h3>
                    <p className="text-gray-500">Check back later for new free templates</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="unlocked" className="mt-0">
              {/* Search and filters for unlocked tab */}
              <div className="border-b pb-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search unlocked templates..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Grid for unlocked templates */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length > 0 ? (
                  currentTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">{getFileIcon(template.fileUrl)}</div>
                          <Badge className={getPricingTierBadgeColor(template.pricingTier)}>
                            {template.pricingTier}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                          <span className="text-sm font-medium">${template.price.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Unlock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No unlocked templates</h3>
                    <p className="text-gray-500">Purchase templates to access them here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="locked" className="mt-0">
              {/* Search and filters for locked tab */}
              <div className="border-b pb-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search locked templates..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Grid for locked templates */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length > 0 ? (
                  currentTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">{getFileIcon(template.fileUrl)}</div>
                          <Badge className={getPricingTierBadgeColor(template.pricingTier)}>
                            {template.pricingTier}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                          <span className="text-sm font-medium">${template.price.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => handlePurchase(template)}>
                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                            Unlock ${template.price}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No locked templates</h3>
                    <p className="text-gray-500">All templates have been unlocked</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {filteredTemplates.length > itemsPerPage && (
        <div className="flex justify-center mt-8 mb-12">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              size="sm"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                size="sm"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Template Benefits</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Attorney-Drafted</h3>
              <p className="text-sm text-gray-600">All templates are drafted by experienced business attorneys</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Regularly Updated</h3>
              <p className="text-sm text-gray-600">Templates are updated to reflect current laws and regulations</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Customizable</h3>
              <p className="text-sm text-gray-600">Easily customize templates to fit your specific business needs</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Receipt Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payment Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTemplate && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{selectedTemplate.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="font-bold">${selectedTemplate.price}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Receipt</label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept="image/*,application/pdf"
              />
              <p className="text-xs text-gray-500">
                Please upload a receipt or proof of payment. Accepted formats: JPG, PNG, PDF.
              </p>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUploadReceipt} disabled={!uploadFile || uploading}>
                {uploading ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

