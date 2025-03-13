"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, FileText, Lock, Search, ShoppingCart, Upload, Check, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Template {
  id: string
  name: string
  description: string
  category: string
  price: number
  pricingTier: string
  purchased: boolean
  fileUrl?: string
  isPending?: boolean
  invoiceId?: string
}

export default function DocumentTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      console.log("Fetching templates...")

      const response = await fetch("/api/user/templates")
      console.log("API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`Failed to fetch templates: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("Templates data:", data)

      if (!data.templates) {
        console.error("No templates array in response:", data)
        throw new Error("Invalid response format: missing templates array")
      }

      // Transform the API response to match our Template interface
      const formattedTemplates = data.templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description || `${template.pricingTier} template for ${template.category}`,
        category: template.category,
        price: template.price || 0,
        pricingTier: template.pricingTier,
        purchased: template.purchased || false,
        fileUrl: template.fileUrl,
        isPending: template.isPending || false,
        invoiceId: template.invoiceId,
      }))

      console.log("Formatted templates:", formattedTemplates)
      setTemplates(formattedTemplates)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load templates. Please try again.",
        variant: "destructive",
      })

      // Set empty array instead of mock data for now to help debug the issue
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const categories = ["All", ...new Set(templates.map((template) => template.category))]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handlePurchase = async (template: Template) => {
    try {
      if (!session) {
        router.push("/login?callbackUrl=/dashboard/documents/templates")
        return
      }

      const response = await fetch("/api/user/templates/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          price: template.price,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to purchase template")
      }

      const data = await response.json()

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
    if (!uploadFile || !selectedInvoice) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("receipt", uploadFile)
      formData.append("invoiceId", selectedInvoice.id)

      const response = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload receipt")
      }

      const data = await response.json()

      // Update the invoice with the receipt URL
      const updateResponse = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentReceipt: data.url,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update invoice with receipt")
      }

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

  const handleDownload = async (template: Template) => {
    if (!template.fileUrl) {
      toast({
        title: "Error",
        description: "Template file not available.",
        variant: "destructive",
      })
      return
    }

    // Open the file URL in a new tab
    window.open(template.fileUrl, "_blank")
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-48">
      <h1 className="text-3xl font-bold mb-6">Document Templates</h1>

      <Card className="mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Premium Templates</h2>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">Unlock all templates for $99</span>
              <Button size="sm" className="ml-2">
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Buy All
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
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

        <div className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <div className="p-6 relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">{template.name}</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                      {template.purchased ? (
                        <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Download
                        </Button>
                      ) : template.isPending ? (
                        <Button size="sm" variant="outline" disabled>
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          Pending
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handlePurchase(template)}>
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Unlock ${template.price}
                        </Button>
                      )}
                    </div>

                    {/* Blur overlay for unpurchased templates */}
                    {!template.purchased && !template.isPending && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <Button size="sm" onClick={() => handlePurchase(template)}>
                            Unlock for ${template.price}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Pending overlay */}
                    {template.isPending && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Payment pending approval</p>
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
                                .catch((err) => {
                                  console.error("Error fetching invoice:", err)
                                  toast({
                                    title: "Error",
                                    description: "Could not fetch invoice details.",
                                    variant: "destructive",
                                  })
                                })
                            }}
                          >
                            Upload Receipt
                          </Button>
                        </div>
                      </div>
                    )}
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
        </div>
      </Card>

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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

