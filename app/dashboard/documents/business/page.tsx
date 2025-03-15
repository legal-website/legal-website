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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  Clock,
  Download,
  File,
  FileText,
  Search,
  Upload,
  Trash2,
  Share2,
  Lock,
  Mail,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Document {
  id: string
  name: string
  description?: string
  category: string
  fileUrl: string
  fileType: string
  fileSize: number
  isPermanent: boolean
  createdAt: string
  updatedAt: string
  uploadedBy?: {
    name: string
    email: string
  }
  sharedWith?: {
    email: string
    sharedAt: string
  }[]
}

interface StorageInfo {
  used: number
  limit: number
  percentage: number
}

export default function BusinessDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ used: 0, limit: 104857600, percentage: 0 })
  const [recentUpdates, setRecentUpdates] = useState<{ text: string; time: string }[]>([])

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Formation",
    file: null as File | null,
    isPermanent: false,
  })

  const [shareForm, setShareForm] = useState({
    email: "",
    message: "",
  })

  const categories = ["All", "Formation", "Tax", "Compliance", "Licenses", "Financial", "HR", "Other"]

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Fetch documents and storage info
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/documents/business")

      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data.documents || [])

      // Update storage info
      if (data.storage) {
        const used = data.storage.totalStorageBytes
        const limit = data.storage.storageLimit
        const percentage = (used / limit) * 100
        setStorageInfo({ used, limit, percentage })
      }

      // Update recent updates
      if (data.recentUpdates) {
        setRecentUpdates(data.recentUpdates)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
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

      // Check if adding this file would exceed storage limit
      if (storageInfo.used + file.size > storageInfo.limit) {
        toast({
          title: "Storage limit exceeded",
          description: "You don't have enough storage space. Please delete some files first.",
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
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category) {
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
      formData.append("isPermanent", uploadForm.isPermanent.toString())
      formData.append("file", uploadForm.file)

      const response = await fetch("/api/user/documents/business/upload", {
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
      fetchDocuments()
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

  // Handle document sharing
  const handleShare = async () => {
    if (!selectedDocument || !shareForm.email) {
      toast({
        title: "Missing information",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/user/documents/business/${selectedDocument.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: shareForm.email,
          message: shareForm.message,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to share document")
      }

      // Reset form
      setShareForm({
        email: "",
        message: "",
      })

      setShowShareDialog(false)

      toast({
        title: "Success",
        description: `Document shared with ${shareForm.email}`,
      })

      // Refresh documents
      fetchDocuments()
    } catch (error) {
      console.error("Error sharing document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share document",
        variant: "destructive",
      })
    }
  }

  // Handle document deletion
  const handleDelete = async () => {
    if (!selectedDocument) return

    // Check if document is permanent
    if (selectedDocument.isPermanent) {
      toast({
        title: "Cannot delete",
        description: "This is a permanent document and cannot be deleted",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
      return
    }

    try {
      const response = await fetch(`/api/user/documents/business/${selectedDocument.id}`, {
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
      fetchDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  // Handle document download
  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/user/documents/business/${document.id}/download`)

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

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Business Documents</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">Document Library</h2>
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload New Document</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4 mt-4">
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
                          Mark as permanent document (cannot be deleted)
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
                            {doc.isPermanent && (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                <Lock className="h-3 w-3" />
                                Permanent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{doc.fileType.toUpperCase()}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                          {doc.description && <p className="text-sm text-gray-500 mt-1">{doc.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setShowShareDialog(true)
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setShowDeleteDialog(true)
                          }}
                          disabled={doc.isPermanent}
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
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Updates</h3>
            </div>
            <div className="p-6">
              {recentUpdates.length > 0 ? (
                <div className="space-y-4">
                  {recentUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm">{update.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{update.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent updates</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Document Storage</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Used Storage</span>
                  <span className="text-sm font-medium">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                  </span>
                </div>
                <Progress value={storageInfo.percentage} className="h-2" />

                {storageInfo.percentage > 90 && (
                  <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>Storage almost full! Please delete some documents.</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Document Retention</h4>
                    <p className="text-sm text-amber-700">
                      Keep your business documents for at least 7 years. Documents marked as permanent cannot be
                      deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{selectedDocument?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedDocument?.fileType.toUpperCase()} •{" "}
                  {selectedDocument && formatBytes(selectedDocument.fileSize)}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="share-email">Email Address*</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="Enter recipient's email"
                value={shareForm.email}
                onChange={(e) => setShareForm({ ...shareForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a message to the recipient"
                value={shareForm.message}
                onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>
              <Mail className="h-4 w-4 mr-2" />
              Share Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
              {selectedDocument?.isPermanent && (
                <div className="mt-2 flex items-center gap-2 text-red-600 font-medium">
                  <Lock className="h-4 w-4" />
                  This is a permanent document and cannot be deleted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={selectedDocument?.isPermanent}
              className={
                selectedDocument?.isPermanent
                  ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

