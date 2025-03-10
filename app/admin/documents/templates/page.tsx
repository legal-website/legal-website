"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Plus, Filter, Download, Edit, Trash2, Copy, Eye, FileUp, CheckCircle2 } from "lucide-react"
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

export default function DocumentTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const categories = ["All Categories", "Business Formation", "Compliance", "Tax", "Legal", "HR", "Financial"]

  const templates = [
    {
      id: 1,
      name: "Articles of Organization",
      category: "Business Formation",
      lastUpdated: "Mar 5, 2025",
      status: "Active",
      usageCount: 342,
      price: "$49.99",
      pricingTier: "Premium",
    },
    {
      id: 2,
      name: "Operating Agreement",
      category: "Business Formation",
      lastUpdated: "Mar 3, 2025",
      status: "Active",
      usageCount: 287,
      price: "$39.99",
      pricingTier: "Standard",
    },
    {
      id: 3,
      name: "Annual Report Template",
      category: "Compliance",
      lastUpdated: "Feb 28, 2025",
      status: "Active",
      usageCount: 156,
      price: "$29.99",
      pricingTier: "Standard",
    },
    {
      id: 4,
      name: "Tax Filing Checklist",
      category: "Tax",
      lastUpdated: "Feb 25, 2025",
      status: "Active",
      usageCount: 98,
      price: "$19.99",
      pricingTier: "Basic",
    },
    {
      id: 5,
      name: "Employee Handbook",
      category: "HR",
      lastUpdated: "Feb 20, 2025",
      status: "Active",
      usageCount: 75,
      price: "$59.99",
      pricingTier: "Premium",
    },
    {
      id: 6,
      name: "Non-Disclosure Agreement",
      category: "Legal",
      lastUpdated: "Feb 18, 2025",
      status: "Active",
      usageCount: 124,
      price: "$24.99",
      pricingTier: "Standard",
    },
    {
      id: 7,
      name: "Financial Statement Template",
      category: "Financial",
      lastUpdated: "Feb 15, 2025",
      status: "Active",
      usageCount: 67,
      price: "$34.99",
      pricingTier: "Standard",
    },
    {
      id: 8,
      name: "Business Plan Template",
      category: "Business Formation",
      lastUpdated: "Feb 10, 2025",
      status: "Active",
      usageCount: 201,
      price: "$49.99",
      pricingTier: "Premium",
    },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All Categories" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and create document templates for client use</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button onClick={() => setShowUploadDialog(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
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

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="recent">Recently Used</TabsTrigger>
          <TabsTrigger value="created">Created by Me</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Upload Template Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Upload a new document template or create one from scratch.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" placeholder="Template name" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <select
                id="category"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {categories
                  .filter((c) => c !== "All Categories")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" placeholder="Brief description of this template" className="col-span-3" />
            </div>

            {/* New Pricing Fields */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <div className="col-span-3 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600">
                  $
                </span>
                <Input id="price" placeholder="49.99" className="rounded-l-none" />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricing-tier" className="text-right">
                Pricing Tier
              </Label>
              <select
                id="pricing-tier"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">File</Label>
              <div className="col-span-3">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-gray-400">Supports PDF, DOCX, XLSX (Max 10MB)</p>
                  <input type="file" className="hidden" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Variables</Label>
              <div className="col-span-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">
                    Define variables that can be replaced when using this template
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Variable name (e.g. COMPANY_NAME)" className="flex-1" />
                      <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({ template }: { template: any }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm line-clamp-1">{template.name}</h3>
              <p className="text-xs text-gray-500">{template.category}</p>
            </div>
          </div>
          <div className="flex">
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs">{template.status}</span>
          </div>
          <span className="text-xs text-gray-500">Updated: {template.lastUpdated}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{template.usageCount} uses</span>
          <div className="flex items-center">
            <span className="text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">
              {template.pricingTier}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-purple-600 dark:text-purple-400">{template.price}</span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

