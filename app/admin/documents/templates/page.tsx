"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Plus,
  Search,
  Download,
  Edit,
  DollarSign,
  Copy,
  Calendar,
  Trash2,
  Unlock,
  Check,
  FileImage,
  FileIcon as FilePdf,
  FileIcon as FileDefault,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Define pricing tier types
type PricingTier = "Free" | "Basic" | "Standard" | "Premium"

// Define template type with pricing
interface Template {
  id: string
  name: string
  category: string
  lastUpdated?: string
  updatedAt: string
  status: string
  usageCount: number
  price: number
  pricingTier: PricingTier
  description?: string
  fileUrl?: string
}

// Define user type
interface User {
  id: string
  name: string | null
  email: string
  role: string
  business?: {
    id: string
    name: string
  } | null
}

// Define template access type
interface TemplateAccess {
  id: string
  documentId: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  businessId: string
  businessName: string
  grantedAt: string
}

// Define sort options
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "downloads"

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateCategory, setNewTemplateCategory] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [newTemplatePricingTier, setNewTemplatePricingTier] = useState<PricingTier>("Free")
  const [newTemplatePrice, setNewTemplatePrice] = useState(0)
  const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  // Add sort state with default to newest
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Add these below the other states
  const [showUnlockTemplateDialog, setShowUnlockTemplateDialog] = useState(false)
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [templateUsersAccess, setTemplateUsersAccess] = useState<TemplateAccess[]>([])
  const [loadingAccess, setLoadingAccess] = useState(false)

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/login?callbackUrl=/admin/documents/templates")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [session, router, toast])

  useEffect(() => {
    if (session && ((session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN")) {
      fetchTemplates()
    }
  }, [session])

  // Reset to first page when sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/templates")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      console.log("Admin templates data:", data) // Debug log

      // If templates is empty, create some mock data for testing
      if (!data.templates || data.templates.length === 0) {
        const mockTemplates: Template[] = [
          {
            id: "1",
            name: "LLC Formation",
            description: "Complete LLC formation document package",
            category: "Business Formation",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 24,
            price: 49.99,
            pricingTier: "Standard" as PricingTier,
            fileUrl: "https://example.com/templates/llc-formation.pdf",
          },
          {
            id: "2",
            name: "Employment Agreement",
            description: "Standard employment agreement template",
            category: "Contracts",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 18,
            price: 29.99,
            pricingTier: "Basic" as PricingTier,
            fileUrl: "https://example.com/templates/employment-agreement.pdf",
          },
          {
            id: "3",
            name: "Privacy Policy",
            description: "Website privacy policy template",
            category: "Compliance",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 32,
            price: 0,
            pricingTier: "Free" as PricingTier,
            fileUrl: "https://example.com/templates/privacy-policy.pdf",
          },
          {
            id: "4",
            name: "Non-Disclosure Agreement",
            description: "Confidentiality agreement for business transactions",
            category: "Contracts",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 15,
            price: 19.99,
            pricingTier: "Basic" as PricingTier,
            fileUrl: "https://example.com/templates/nda.pdf",
          },
          {
            id: "5",
            name: "Corporation Formation",
            description: "Complete corporation formation document package",
            category: "Business Formation",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 12,
            price: 79.99,
            pricingTier: "Premium" as PricingTier,
            fileUrl: "https://example.com/templates/corporation-formation.pdf",
          },
          {
            id: "6",
            name: "Terms of Service",
            description: "Website terms of service template",
            category: "Compliance",
            updatedAt: new Date().toISOString(),
            status: "active",
            usageCount: 28,
            price: 0,
            pricingTier: "Free" as PricingTier,
            fileUrl: "https://example.com/templates/terms-of-service.pdf",
          },
        ]
        setTemplates(mockTemplates)
      } else {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      })

      // Set mock data for testing if API fails
      const mockTemplates: Template[] = [
        {
          id: "1",
          name: "LLC Formation",
          description: "Complete LLC formation document package",
          category: "Business Formation",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 24,
          price: 49.99,
          pricingTier: "Standard" as PricingTier,
          fileUrl: "https://example.com/templates/llc-formation.pdf",
        },
        {
          id: "2",
          name: "Employment Agreement",
          description: "Standard employment agreement template",
          category: "Contracts",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 18,
          price: 29.99,
          pricingTier: "Basic" as PricingTier,
          fileUrl: "https://example.com/templates/employment-agreement.pdf",
        },
        {
          id: "3",
          name: "Privacy Policy",
          description: "Website privacy policy template",
          category: "Compliance",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 32,
          price: 0,
          pricingTier: "Free" as PricingTier,
          fileUrl: "https://example.com/templates/privacy-policy.pdf",
        },
        {
          id: "4",
          name: "Non-Disclosure Agreement",
          description: "Confidentiality agreement for business transactions",
          category: "Contracts",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 15,
          price: 19.99,
          pricingTier: "Basic" as PricingTier,
          fileUrl: "https://example.com/templates/nda.pdf",
        },
        {
          id: "5",
          name: "Corporation Formation",
          description: "Complete corporation formation document package",
          category: "Business Formation",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 12,
          price: 79.99,
          pricingTier: "Premium" as PricingTier,
          fileUrl: "https://example.com/templates/corporation-formation.pdf",
        },
        {
          id: "6",
          name: "Terms of Service",
          description: "Website terms of service template",
          category: "Compliance",
          updatedAt: new Date().toISOString(),
          status: "active",
          usageCount: 28,
          price: 0,
          pricingTier: "Free" as PricingTier,
          fileUrl: "https://example.com/templates/terms-of-service.pdf",
        },
      ]
      setTemplates(mockTemplates)
    } finally {
      setLoading(false)
    }
  }

  // Add this function to handle direct file downloads
  const handleDownload = async (template: Template) => {
    try {
      setDownloadingId(template.id)

      if (!template.fileUrl) {
        throw new Error("No file URL available")
      }

      // Get file extension from URL
      const urlWithoutParams = template.fileUrl.split("?")[0]
      const urlParts = urlWithoutParams.split(".")
      const fileExtension = urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : ""

      // Create a sanitized filename with the correct extension
      const fileName = `${template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${fileExtension}`

      // Fetch the actual file as a blob
      const fileResponse = await fetch(template.fileUrl)

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
      }

      // Get the file as a blob
      const blob = await fileResponse.blob()

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)

      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      })
    } catch (error: any) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  // Get file icon based on file extension
  const getFileIcon = (fileUrl: string | undefined) => {
    if (!fileUrl) return <FileDefault className="h-5 w-5 text-gray-600" />

    const extension = fileUrl.split(".").pop()?.toLowerCase().split("?")[0]

    switch (extension) {
      case "pdf":
        return <FilePdf className="h-5 w-5 text-red-600" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "xls":
      case "xlsx":
        return <FileText className="h-5 w-5 text-green-600" />
      case "ppt":
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const handleCreateTemplate = async () => {
    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!newTemplateName || !newTemplateCategory) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // First upload the file if there is one
      let fileUrl = ""
      if (newTemplateFile) {
        const formData = new FormData()
        formData.append("file", newTemplateFile)

        const uploadResponse = await fetch("/api/upload-template", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload template file")
        }

        const uploadData = await uploadResponse.json()
        fileUrl = uploadData.url
      } else {
        toast({
          title: "Missing File",
          description: "Please upload a template file.",
          variant: "destructive",
        })
        return
      }

      // Get the first business ID for admin (temporary solution)
      const businessResponse = await fetch("/api/admin/business")
      if (!businessResponse.ok) {
        throw new Error("Failed to get business information")
      }
      const businessData = await businessResponse.json()
      const businessId = businessData.businesses[0]?.id

      if (!businessId) {
        throw new Error("No business found for template")
      }

      // Create the template
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDescription,
          category: newTemplateCategory,
          pricingTier: newTemplatePricingTier,
          price: newTemplatePrice,
          fileUrl: fileUrl,
          businessId: businessId,
          type: "template",
          status: "active",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create template")
      }

      toast({
        title: "Success",
        description: "Template created successfully.",
      })

      // Reset form and close dialog
      setNewTemplateName("")
      setNewTemplateCategory("")
      setNewTemplateDescription("")
      setNewTemplatePricingTier("Free")
      setNewTemplatePrice(0)
      setNewTemplateFile(null)
      setShowNewTemplateDialog(false)

      // Refresh templates
      fetchTemplates()
    } catch (error: any) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setIsSubmitting(true)

      // First upload the file if there is one
      let fileUrl = selectedTemplate.fileUrl || ""
      if (newTemplateFile) {
        const formData = new FormData()
        formData.append("file", newTemplateFile)

        const uploadResponse = await fetch("/api/upload-template", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload template file")
        }

        const uploadData = await uploadResponse.json()
        fileUrl = uploadData.url
      }

      // Get the first business ID for admin (temporary solution)
      const businessResponse = await fetch("/api/admin/business")
      if (!businessResponse.ok) {
        throw new Error("Failed to get business information")
      }
      const businessData = await businessResponse.json()
      const businessId = businessData.businesses[0]?.id

      if (!businessId) {
        throw new Error("No business found for template")
      }

      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDescription,
          category: newTemplateCategory,
          pricingTier: newTemplatePricingTier,
          price: newTemplatePrice,
          fileUrl: fileUrl,
          businessId: businessId,
          type: "template",
          status: "active",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update template")
      }

      toast({
        title: "Success",
        description: "Template updated successfully.",
      })

      // Reset form and close dialog
      setSelectedTemplate(null)
      setNewTemplateName("")
      setNewTemplateCategory("")
      setNewTemplateDescription("")
      setNewTemplatePricingTier("Free")
      setNewTemplatePrice(0)
      setNewTemplateFile(null)
      setShowEditTemplateDialog(false)

      // Refresh templates
      fetchTemplates()
    } catch (error: any) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      toast({
        title: "Success",
        description: "Template deleted successfully.",
      })

      // Refresh templates
      fetchTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add this function after the handleDeleteTemplate function
  const handleDownloadTemplate = async (template: Template) => {
    try {
      const fileUrl = template.fileUrl
      let fileName = template.name.replace(/\s+/g, "-").toLowerCase()

      // If no direct fileUrl is available, try to fetch it from the API
      if (!fileUrl) {
        toast({
          title: "Error",
          description: "No file URL available for this template.",
          variant: "destructive",
        })
        return
      }

      // Extract file extension from URL
      const urlExtension = fileUrl.split(".").pop()?.toLowerCase()?.split("?")[0]

      // If URL has a valid extension, use it
      if (
        urlExtension &&
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "gif"].includes(urlExtension)
      ) {
        fileName = `${fileName}.${urlExtension}`
      } else {
        // Default to PDF if no extension is found
        fileName = `${fileName}.pdf`
      }

      toast({
        title: "Download started",
        description: "Your template is being downloaded.",
      })

      // Use fetch to get the file as a blob
      const response = await fetch(fileUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const blob = await response.blob()

      // Check if the blob has content
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
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (template: Template) => {
    setSelectedTemplate(template)
    setNewTemplateName(template.name)
    setNewTemplateCategory(template.category)
    setNewTemplateDescription(template.description || "")
    setNewTemplatePricingTier(template.pricingTier)
    setNewTemplatePrice(template.price)
    setNewTemplateFile(null)
    setShowEditTemplateDialog(true)
  }

  const handleDuplicateTemplate = (template: Template) => {
    setNewTemplateName(`${template.name} (Copy)`)
    setNewTemplateCategory(template.category)
    setNewTemplateDescription(template.description || "")
    setNewTemplatePricingTier(template.pricingTier)
    setNewTemplatePrice(template.price)
    setNewTemplateFile(null)
    setShowNewTemplateDialog(true)
  }

  const searchUsers = async (query: string) => {
    try {
      setLoadingUsers(true)
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchTemplateAccess = async (templateId: string) => {
    try {
      setLoadingAccess(true)
      const response = await fetch(`/api/admin/templates/${templateId}/access`)

      if (!response.ok) {
        throw new Error("Failed to fetch template access")
      }

      const data = await response.json()
      setTemplateUsersAccess(data.templateAccess || [])
    } catch (error) {
      console.error("Error fetching template access:", error)
      toast({
        title: "Error",
        description: "Failed to fetch template access. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAccess(false)
    }
  }

  const grantTemplateAccess = async () => {
    if (!selectedTemplate || !selectedUserId) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/admin/templates/grant-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          userId: selectedUserId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to grant template access")
      }

      toast({
        title: "Success",
        description: "Template access granted successfully.",
      })

      // Refresh template access
      fetchTemplateAccess(selectedTemplate.id)

      // Reset selected user
      setSelectedUserId(null)
      setSearchUserQuery("")
    } catch (error: any) {
      console.error("Error granting template access:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to grant template access. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeTemplateAccess = async (userId: string) => {
    if (!selectedTemplate) return

    try {
      setLoadingAccess(true)

      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}/access`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove template access")
      }

      toast({
        title: "Success",
        description: "Template access removed successfully.",
      })

      // Refresh template access
      fetchTemplateAccess(selectedTemplate.id)
    } catch (error: any) {
      console.error("Error removing template access:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove template access. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAccess(false)
    }
  }

  // Add this function to handle opening the unlock dialog
  const handleUnlockForUser = (template: Template) => {
    setSelectedTemplate(template)
    setShowUnlockTemplateDialog(true)
    fetchTemplateAccess(template.id)
  }

  // Filter templates based on search query and active tab
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "free") return matchesSearch && template.pricingTier === "Free"
    if (activeTab === "paid") return matchesSearch && template.pricingTier !== "Free"
    if (activeTab === "business-formation") return matchesSearch && template.category === "Business Formation"
    if (activeTab === "compliance") return matchesSearch && template.category === "Compliance"
    if (activeTab === "contracts") return matchesSearch && template.category === "Contracts"

    return matchesSearch
  })

  // Sort templates based on the selected sort option
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case "oldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "downloads":
        return b.usageCount - a.usageCount
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  // Get sort option label
  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "newest":
        return "Newest"
      case "oldest":
        return "Oldest"
      case "name-asc":
        return "Name (A-Z)"
      case "name-desc":
        return "Name (Z-A)"
      case "price-asc":
        return "Price (Low to High)"
      case "price-desc":
        return "Price (High to Low)"
      case "downloads":
        return "Most Downloaded"
      default:
        return "Newest"
    }
  }

  // Pagination logic
  const indexOfLastTemplate = currentPage * itemsPerPage
  const indexOfFirstTemplate = indexOfLastTemplate - itemsPerPage
  const currentTemplates = sortedTemplates.slice(indexOfFirstTemplate, indexOfLastTemplate)
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage)

  // Add a function to handle page changes:
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Get pricing tier badge color
  const getPricingTierBadgeColor = (tier: PricingTier) => {
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

  function TemplateCard({ template }: { template: Template }) {
    // Format the date
    const lastUpdated = new Date(template.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    return (
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              {getFileIcon(template.fileUrl)}
            </div>
            <Badge className={getPricingTierBadgeColor(template.pricingTier)}>{template.pricingTier}</Badge>
          </div>
          <h3 className="font-medium mb-1">{template.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.category}</p>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Updated: {lastUpdated}
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            <Download className="h-3.5 w-3.5 mr-1" />
            {template.usageCount} downloads
          </div>

          <div className="flex items-center text-sm font-medium mb-4">
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            {template.price.toFixed(2)}
          </div>

          <div className="flex space-x-2 flex-wrap">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(template)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicateTemplate(template)}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleUnlockForUser(template)}>
              <Unlock className="h-4 w-4 mr-1" />
              Unlock
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 mt-2"
              onClick={() => handleDownloadTemplate(template)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-none text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 mt-2"
              onClick={() => handleDeleteTemplate(template.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and create document templates for your clients</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort: {getSortLabel(sortBy)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                <SortDesc className="mr-2 h-4 w-4" />
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                <SortAsc className="mr-2 h-4 w-4" />
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                <SortAsc className="mr-2 h-4 w-4" />
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                <SortDesc className="mr-2 h-4 w-4" />
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-asc")}>
                <SortAsc className="mr-2 h-4 w-4" />
                Price (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-desc")}>
                <SortDesc className="mr-2 h-4 w-4" />
                Price (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("downloads")}>
                <Download className="mr-2 h-4 w-4" />
                Most Downloaded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex items-center"
            onClick={() => setShowNewTemplateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="business-formation">Business Formation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid - Fixed to show 3 per row on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.length > 0 ? (
          currentTemplates.map((template) => <TemplateCard key={template.id} template={template} />)
        ) : (
          <div className="col-span-3 text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {sortedTemplates.length > itemsPerPage && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Add a new document template to the system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-1 sm:px-2">
            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Template Name*
              </label>
              <Input
                id="name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full"
                placeholder="e.g. LLC Formation"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category*
              </label>
              <Input
                id="category"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                className="w-full"
                placeholder="e.g. Business Formation"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="w-full min-h-[100px]"
                placeholder="Brief description of the template"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="pricingTier" className="text-sm font-medium">
                Pricing Tier
              </label>
              <select
                id="pricingTier"
                value={newTemplatePricingTier}
                onChange={(e) => {
                  setNewTemplatePricingTier(e.target.value as PricingTier)
                  if (e.target.value === "Free") {
                    setNewTemplatePrice(0)
                  }
                }}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <Input
                  id="price"
                  type="number"
                  value={newTemplatePrice}
                  onChange={(e) => setNewTemplatePrice(Number.parseFloat(e.target.value))}
                  className="pl-10 w-full"
                  placeholder="0.00"
                  disabled={newTemplatePricingTier === "Free"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="file" className="text-sm font-medium">
                Template File*
              </label>
              <Input
                id="file"
                type="file"
                className="w-full"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewTemplateFile(e.target.files[0])
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateTemplate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-1 sm:px-2">
            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Template Name*
              </label>
              <Input
                id="edit-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full"
                placeholder="e.g. LLC Formation"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-category" className="text-sm font-medium">
                Category*
              </label>
              <Input
                id="edit-category"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                className="w-full"
                placeholder="e.g. Business Formation"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="w-full min-h-[100px]"
                placeholder="Brief description of the template"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-pricingTier" className="text-sm font-medium">
                Pricing Tier
              </label>
              <select
                id="edit-pricingTier"
                value={newTemplatePricingTier}
                onChange={(e) => {
                  setNewTemplatePricingTier(e.target.value as PricingTier)
                  if (e.target.value === "Free") {
                    setNewTemplatePrice(0)
                  }
                }}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-price" className="text-sm font-medium">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <Input
                  id="edit-price"
                  type="number"
                  value={newTemplatePrice}
                  onChange={(e) => setNewTemplatePrice(Number.parseFloat(e.target.value))}
                  className="pl-10 w-full"
                  placeholder="0.00"
                  disabled={newTemplatePricingTier === "Free"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="edit-file" className="text-sm font-medium">
                Template File
              </label>
              <Input
                id="edit-file"
                type="file"
                className="w-full"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewTemplateFile(e.target.files[0])
                  }
                }}
              />
              {selectedTemplate?.fileUrl && (
                <p className="text-xs text-gray-500 mt-1">Current file: {selectedTemplate.fileUrl.split("/").pop()}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleEditTemplate} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Template Dialog */}
      <Dialog open={showUnlockTemplateDialog} onOpenChange={setShowUnlockTemplateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unlock Template for User</DialogTitle>
            <DialogDescription>
              {selectedTemplate && <span>Grant access to {selectedTemplate.name} for a specific user</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-1 sm:px-2">
            {selectedTemplate && (
              <div className="p-4 border rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTemplate.category}</p>
                    <div className="mt-1 flex items-center text-sm">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      <span>{selectedTemplate.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Search User by Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by email..."
                  className="pl-10"
                  value={searchUserQuery}
                  onChange={(e) => {
                    setSearchUserQuery(e.target.value)
                    if (e.target.value.length > 2) {
                      searchUsers(e.target.value)
                    }
                  }}
                />
              </div>

              {loadingUsers && (
                <div className="py-2 text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-500">Searching users...</span>
                </div>
              )}

              {!loadingUsers && users.length > 0 && (
                <div className="max-h-[30vh] overflow-y-auto border rounded-md mt-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer ${
                        selectedUserId === user.id ? "bg-purple-50" : ""
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.name
                              ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name || "Unnamed User"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="h-5 w-5 rounded-full bg-purple-200 flex items-center justify-center">
                          <Check className="h-3 w-3 text-purple-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loadingUsers && searchUserQuery.length > 2 && users.length === 0 && (
                <p className="text-sm text-gray-500 py-2">No users found. Try a different search term.</p>
              )}
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Current Access</h3>
              {loadingAccess ? (
                <div className="py-2 text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading access list...</span>
                </div>
              ) : templateUsersAccess.length > 0 ? (
                <div className="max-h-[30vh] overflow-y-auto border rounded-md">
                  {templateUsersAccess.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {access.user.name
                              ? access.user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : access.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{access.user.name || "Unnamed User"}</p>
                          <p className="text-xs text-gray-500">{access.user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeTemplateAccess(access.user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No users have access to this template yet.</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setShowUnlockTemplateDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={grantTemplateAccess}
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting ? "Granting Access..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

