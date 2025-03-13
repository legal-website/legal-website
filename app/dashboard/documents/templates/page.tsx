"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Clock, Download, FileText, Search, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Template {
  id: string
  name: string
  description: string
  category: string
  updatedAt: string
  price: number
  pricingTier: string
  purchased: boolean
  isPending?: boolean
  invoiceId?: string
  fileUrl?: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (templates.length > 0) {
      filterTemplates()
    }
  }, [searchQuery, activeTab, templates])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching templates...")

      const response = await fetch("/api/user/templates")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.error || `Failed to fetch templates: ${response.status}`)
      }

      const data = await response.json()
      console.log("Templates data:", data)

      if (!data.templates || !Array.isArray(data.templates)) {
        console.error("Invalid templates data:", data)
        throw new Error("Invalid response format")
      }

      setTemplates(data.templates)
    } catch (error: any) {
      console.error("Error fetching templates:", error)
      setError(error.message || "Failed to load templates")

      // Set mock templates for testing if there's an error
      setTemplates([
        {
          id: "mock-1",
          name: "LLC Formation",
          description: "Complete LLC formation document package",
          category: "Business Formation",
          updatedAt: new Date().toISOString(),
          price: 49.99,
          pricingTier: "Standard",
          purchased: false,
          isPending: false,
        },
        {
          id: "mock-2",
          name: "Employment Agreement",
          description: "Standard employment agreement template",
          category: "Contracts",
          updatedAt: new Date().toISOString(),
          price: 29.99,
          pricingTier: "Basic",
          purchased: false,
          isPending: false,
        },
        {
          id: "mock-3",
          name: "Privacy Policy",
          description: "Website privacy policy template",
          category: "Compliance",
          updatedAt: new Date().toISOString(),
          price: 0,
          pricingTier: "Free",
          purchased: true,
          isPending: false,
          fileUrl: "https://example.com/templates/privacy-policy.pdf",
        },
      ])

      toast({
        title: "Error",
        description: `Failed to load templates: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by tab
    if (activeTab === "purchased") {
      filtered = filtered.filter((template) => template.purchased)
    } else if (activeTab === "pending") {
      filtered = filtered.filter((template) => template.isPending)
    }

    setFilteredTemplates(filtered)
  }

  const handlePurchase = async () => {
    if (!selectedTemplate) return

    try {
      setPurchasing(true)
      const response = await fetch("/api/user/templates/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          price: selectedTemplate.price,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to purchase template")
      }

      const data = await response.json()
      console.log("Purchase response:", data)

      // Update the template status in the local state
      setTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          template.id === selectedTemplate.id ? { ...template, isPending: true, invoiceId: data.invoice.id } : template,
        ),
      )

      toast({
        title: "Purchase initiated",
        description: "Your purchase is pending. Please upload a payment receipt to complete the transaction.",
      })

      // Close the purchase dialog and open the upload dialog
      setShowPurchaseDialog(false)
      setSelectedTemplate({ ...selectedTemplate, isPending: true, invoiceId: data.invoice.id })
      setShowUploadDialog(true)
    } catch (error: any) {
      console.error("Error purchasing template:", error)
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPurchasing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleUploadReceipt = async () => {
    if (!selectedTemplate || !selectedTemplate.invoiceId || !uploadFile) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("invoiceId", selectedTemplate.invoiceId)

      const response = await fetch("/api/user/templates/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload receipt")
      }

      toast({
        title: "Receipt uploaded",
        description: "Your receipt has been uploaded and is pending approval.",
      })

      setShowUploadDialog(false)
      setUploadFile(null)
      fetchTemplates() // Refresh the templates list
    } catch (error: any) {
      console.error("Error uploading receipt:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = (template: Template) => {
    if (template.fileUrl) {
      window.open(template.fileUrl, "_blank")
    } else {
      toast({
        title: "Download failed",
        description: "Template file is not available.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <p>Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Browse and purchase document templates for your business
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading templates</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchTemplates}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="purchased">Purchased</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No templates found</h3>
          <p className="mt-1 text-gray-500">
            {activeTab === "all"
              ? "No templates match your search criteria."
              : activeTab === "purchased"
                ? "You haven't purchased any templates yet."
                : "You don't have any pending template purchases."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.pricingTier === "Free" ? "outline" : "default"}>
                    {template.pricingTier}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Category: {template.category}</span>
                  {template.price > 0 ? (
                    <span className="font-medium">${template.price.toFixed(2)}</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3 flex justify-between">
                {template.purchased ? (
                  <Button variant="default" className="w-full" onClick={() => downloadTemplate(template)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                ) : template.isPending ? (
                  <div className="w-full">
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowUploadDialog(true)
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Receipt
                    </Button>
                    <p className="text-xs text-center text-amber-600 dark:text-amber-400">Payment pending approval</p>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowPurchaseDialog(true)
                    }}
                  >
                    Purchase
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Template</DialogTitle>
            <DialogDescription>
              You are about to purchase the following template. An invoice will be created for your purchase.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTemplate.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">Category</Label>
                  <p>{selectedTemplate.category}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">Price</Label>
                  <p className="font-semibold">${selectedTemplate.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payment Receipt</DialogTitle>
            <DialogDescription>
              Please upload a receipt or proof of payment for your template purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="receipt">Receipt File</Label>
              <Input id="receipt" type="file" accept="image/*,.pdf" onChange={handleFileChange} className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, PDF (max 5MB)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUploadReceipt} disabled={uploading || !uploadFile}>
              {uploading ? "Uploading..." : "Upload Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

