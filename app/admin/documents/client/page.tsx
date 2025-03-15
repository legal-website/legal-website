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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Filter,
  Download,
  Plus,
  FileText,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  FileUp,
  Mail,
  Check,
  RefreshCcw,
  AlertCircle,
} from "lucide-react"

// Define types for our data
interface Document {
  id: string
  name: string
  description?: string
  category: string
  fileUrl: string
  fileType: string
  fileSize: number
  status: "Verified" | "Pending" | "Rejected"
  uploadDate: string
  lastModified: string
  sharedWith?: {
    email: string
    sharedAt: string
  }[]
}

interface User {
  id: string
  name: string | null
  email: string
  business?: {
    id: string
    name: string
  } | null
}

export default function ClientDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Formation",
    file: null as File | null,
    userId: "",
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

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/documents/client")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError(error instanceof Error ? error.message : "Failed to load documents")
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Search users
  const searchUsers = async (query: string) => {
    try {
      setLoadingUsers(true)
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search users")
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
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category || !uploadForm.userId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file and user",
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
      formData.append("userId", uploadForm.userId)
      formData.append("file", uploadForm.file)

      const response = await fetch("/api/admin/documents/client/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload document")
      }

      // Reset form
      setUploadForm({
        name: "",
        description: "",
        category: "Formation",
        file: null,
        userId: "",
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setShowUploadDialog(false)
      setSelectedUserId(null)
      setSearchUserQuery("")

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

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/client/${documentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete document")
      }

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
      const response = await fetch(`/api/admin/documents/client/${document.id}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download document")
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      if (typeof window !== "undefined") {
        const link = window.document.createElement("a")
        link.href = data.downloadUrl
        link.setAttribute("download", document.name)
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    }
  }

  // Handle document verification
  const handleVerifyDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/client/${documentId}/verify`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify document")
      }

      toast({
        title: "Success",
        description: "Document verified successfully",
      })

      // Refresh documents
      fetchDocuments()
    } catch (error) {
      console.error("Error verifying document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify document",
        variant: "destructive",
      })
    }
  }

  // Filter documents based on search, category, and status
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "verified" && doc.status === "Verified") ||
      (selectedStatus === "pending" && doc.status === "Pending") ||
      (selectedStatus === "rejected" && doc.status === "Rejected")

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
        router.push("/login?callbackUrl=/admin/documents/client")
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
      } else {
        fetchDocuments()
      }
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/documents/client")
    }
  }, [status, router, session, toast])

  if (status === "loading" || loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Client Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all client documents in the system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowUploadDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
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

        <div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
          {error && (
            <Button variant="outline" onClick={fetchDocuments}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchDocuments}>Try Again</Button>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">Document</th>
                  <th className="text-left p-4 font-medium text-sm">Category</th>
                  <th className="text-left p-4 font-medium text-sm">Shared With</th>
                  <th className="text-left p-4 font-medium text-sm">Upload Date</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatBytes(doc.fileSize)} • {doc.fileType.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{doc.category}</td>
                    <td className="p-4">
                      {doc.sharedWith && doc.sharedWith.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {doc.sharedWith.map((user, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not shared</span>
                      )}
                    </td>
                    <td className="p-4">{doc.uploadDate}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${
                          doc.status === "Verified"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : doc.status === "Pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {doc.status === "Verified" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : doc.status === "Pending" ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {doc.status === "Pending" && (
                              <DropdownMenuItem
                                className="text-green-600 dark:text-green-400"
                                onClick={() => handleVerifyDocument(doc.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Verify
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No documents match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="document-name">Document Name*</Label>
              <Input
                id="document-name"
                placeholder="e.g. Articles of Organization"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="document-category">Document Category*</Label>
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

            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="document-description">Description (Optional)</Label>
              <Textarea
                id="document-description"
                placeholder="Brief description of the document"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <Label>Client*</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients by email..."
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
                  <div className="max-h-60 overflow-y-auto border rounded-md mt-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer ${
                          selectedUserId === user.id ? "bg-purple-50" : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setUploadForm({ ...uploadForm, userId: user.id })
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600 font-medium">
                              {user.name
                                ? user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                : user.email[0].toUpperCase()}
                            </span>
                          </div>
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
            </div>

            <div className="grid grid-cols-1 items-center gap-2">
              <Label>File*</Label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-gray-400">Supports PDF, DOCX, XLSX, JPG, PNG (Max 10MB)</p>
                <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                {uploadForm.file && (
                  <div className="mt-4 text-left p-2 bg-gray-50 rounded flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm truncate">{uploadForm.file.name}</span>
                    <span className="text-xs text-gray-500">({formatBytes(uploadForm.file.size)})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

