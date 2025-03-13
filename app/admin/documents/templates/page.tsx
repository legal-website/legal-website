"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Download, Edit, DollarSign, Filter, Copy, Calendar, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

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

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/templates")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
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
      }

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
          fileUrl,
          status: "active",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create template")
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
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
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
          fileUrl,
          status: "active",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update template")
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
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      })
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
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge className={getPricingTierBadgeColor(template.pricingTier as PricingTier)}>
              {template.pricingTier}
            </Badge>
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

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(template)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicateTemplate(template)}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-none text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
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
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and create document templates for your clients</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Add a new document template to the system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. LLC Formation"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right text-sm font-medium">
                Category
              </label>
              <Input
                id="category"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Business Formation"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of the template"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="pricingTier" className="text-right text-sm font-medium">
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
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right text-sm font-medium">
                Price
              </label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <Input
                  id="price"
                  type="number"
                  value={newTemplatePrice}
                  onChange={(e) => setNewTemplatePrice(Number.parseFloat(e.target.value))}
                  className="pl-10"
                  placeholder="0.00"
                  disabled={newTemplatePricingTier === "Free"}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="file" className="text-right text-sm font-medium">
                Template File
              </label>
              <Input
                id="file"
                type="file"
                className="col-span-3"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewTemplateFile(e.target.files[0])
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-name" className="text-right text-sm font-medium">
                Name
              </label>
              <Input
                id="edit-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. LLC Formation"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-category" className="text-right text-sm font-medium">
                Category
              </label>
              <Input
                id="edit-category"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Business Formation"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-description" className="text-right text-sm font-medium">
                Description
              </label>
              <Input
                id="edit-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of the template"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-pricingTier" className="text-right text-sm font-medium">
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
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-price" className="text-right text-sm font-medium">
                Price
              </label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <Input
                  id="edit-price"
                  type="number"
                  value={newTemplatePrice}
                  onChange={(e) => setNewTemplatePrice(Number.parseFloat(e.target.value))}
                  className="pl-10"
                  placeholder="0.00"
                  disabled={newTemplatePricingTier === "Free"}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-file" className="text-right text-sm font-medium">
                Template File
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewTemplateFile(e.target.files[0])
                    }
                  }}
                />
                {selectedTemplate?.fileUrl && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current file: {selectedTemplate.fileUrl.split("/").pop()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleEditTemplate}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

