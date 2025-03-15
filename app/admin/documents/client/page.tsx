"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Download, File, FileText, Search, Building, Upload, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Document {
  id: string
  name: string
  description?: string
  category: string
  fileUrl: string
  fileType: string
  fileSize: number
  businessName: string
  businessId: string
  isPermanent: boolean
  createdAt: string
  updatedAt: string
}

interface Business {
  id: string
  name: string
}

export default function AdminClientDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBusiness, setSelectedBusiness] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [documents, setDocuments] = useState<Document[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<string[]>([
    "All",
    "Formation",
    "Tax",
    "Compliance",
    "Licenses",
    "Financial",
    "HR",
    "Other",
  ])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Formation",
    businessId: "",
    file: null as File | null,
    isPermanent: false,
  })

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Fetch client documents and businesses
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch businesses first
      const businessResponse = await fetch("/api/admin/business")
      if (!businessResponse.ok) {
        throw new Error("Failed to fetch businesses")
      }
      const businessData = await businessResponse.json()
      setBusinesses(businessData.businesses || [])

      // Fetch documents
      const response = await fetch("/api/admin/documents/client")
      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        })
        return
      }

      setUploadForm({
        ...uploadForm,
        file,
      })
    }
  }

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category || !uploadForm.businessId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Create form data
      const formData = new FormData()
      formData.append("name", uploadForm.name)
      formData.append("description", uploadForm.description)
      formData.append("category", uploadForm.category)
      formData.append("businessId", uploadForm.businessId)
      formData.append("isPermanent", uploadForm.isPermanent.toString())
      formData.append("file", uploadForm.file)

      const response = await fetch("/api/admin/documents/client/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to upload document")
      }

      // Reset form
      setUploadForm({
        name: "",
        description: "",
        category: "Formation",
        businessId: "",
        file: null,
        isPermanent: false,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setShowUploadDialog(false)

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })

      // Refresh documents
      fetchData()
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle document download
  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/admin/documents/client/${document.id}/download`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to download document")
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      const link = window.document.createElement("a")
      link.href = data.downloadUrl
      link.setAttribute("download", document.name)
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    }
  }

  // Handle document deletion
  const handleDelete = async () => {
    if (!selectedDocument) return

    try {
      const response = await fetch(`/api/admin/documents/client/${selectedDocument.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete document")
      }

      setShowDeleteDialog(false)

      toast({
        title: "Success",
        description: "Document deleted successfully",
      })

      // Refresh documents
      fetchData()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  // Filter documents based on search, business, and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBusiness = selectedBusiness === "All" || doc.businessId === selectedBusiness
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory

    return matchesSearch && matchesBusiness && matchesCategory
  })

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const userRole = (session?.user as any)?.role
      if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        router.push("/dashboard")
        return
      }

      fetchData()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router, session])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Client Documents</h1>

      <Card className="mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Manage Client Documents</h2>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document for Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document for Client</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="business">Business/Client*</Label>
                    <Select
                      value={uploadForm.businessId}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, businessId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-name">Document Name*</Label>
                    <Input
                      id="doc-name"
                      placeholder="Enter document name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-description">Description (Optional)</Label>
                    <Textarea
                      id="doc-description"
                      placeholder="Enter document description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-category">Category*</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c !== "All")
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-file">File*</Label>
                    <Input id="doc-file" type="file" ref={fileInputRef} onChange={handleFileChange} required />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 10MB. Supported formats: PDF, DOCX, XLSX, JPG, PNG
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-permanent"
                      checked={uploadForm.isPermanent}
                      onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isPermanent: checked === true })}
                    />
                    <Label
                      htmlFor="is-permanent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as permanent document (cannot be deleted by client)
                    </Label>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadDialog(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleUpload} disabled={uploading}>
                      {uploading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Businesses</SelectItem>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{doc.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                        {doc.isPermanent && (
                          <Badge variant="secondary" className="text-xs">
                            Permanent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Created {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.description && <p className="text-sm text-gray-500 mt-1">{doc.description}</p>}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Building className="h-3 w-3" />
                        <span>{doc.businessName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setShowDocumentDialog(true)
                      }}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters, or upload a new document.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{selectedDocument.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedDocument.fileType.toUpperCase()} • {formatBytes(selectedDocument.fileSize)}
                  </p>
                </div>
              </div>

              {selectedDocument.description && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{selectedDocument.description}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Document Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p>{selectedDocument.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Business</p>
                    <p>{selectedDocument.businessName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created On</p>
                    <p>{new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Permanent</p>
                    <p>{selectedDocument.isPermanent ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => handleDownload(selectedDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this document? This action cannot be undone.</p>
            {selectedDocument && (
              <div className="mt-4 p-4 border rounded-md">
                <p className="font-medium">{selectedDocument.name}</p>
                <p className="text-sm text-gray-500">Business: {selectedDocument.businessName}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

