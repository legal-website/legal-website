"use client"

import type React from "react"

import type { Document as DocumentType } from "@/types/document"
import { Fragment, useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  Clock,
  FileUp,
  Check,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Trash,
} from "lucide-react"
import { FileTypeIcon } from "@/components/file-type-icon"

interface User {
  id: string
  name: string | null
  email: string
  business?: {
    id: string
    name: string
  } | null
}

interface PaginationData {
  total: number
  page: number
  limit: number
  pages: number
}

export default function ClientDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Bulk selection states
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Formation",
    file: null as File | null,
    userId: "",
    isPermanent: false,
  })

  const categories = ["All", "Formation", "Tax", "Compliance", "Licenses", "Financial", "HR", "Other"]

  // Helper function to check if a document is a template
  const isTemplate = (doc: DocumentType): boolean => {
    // Check various conditions that might indicate a template
    const typeCheck = doc.type?.toLowerCase().includes("template") || false
    const nameCheck = doc.name?.toLowerCase().includes("template") || false

    // Return true if any condition is met
    return typeCheck || nameCheck
  }

  // Format bytes to human readable format
  const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Get file extension from name or type
  const getFileExtension = (doc: DocumentType): string => {
    if (doc.fileType) {
      return doc.fileType.toLowerCase().replace("application/", "").replace("image/", "")
    }

    if (doc.name) {
      const parts = doc.name.split(".")
      if (parts.length > 1) {
        return parts[parts.length - 1].toLowerCase()
      }
    }

    return "unknown"
  }

  // Fetch documents
  const fetchDocuments = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching client documents (page ${page}, limit ${limit})`)
      const response = await fetch(`/api/admin/documents/client?page=${page}&limit=${limit}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch documents")
      }

      const data = await response.json()
      console.log("Received documents data:", data)

      if (Array.isArray(data.documents)) {
        // Filter out templates
        const nonTemplateDocuments = data.documents.filter((doc: DocumentType) => !isTemplate(doc))
        setDocuments(nonTemplateDocuments)

        // Set pagination data
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        console.error("Invalid documents data format:", data)
        setError("Invalid data format received from server")
      }
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    setCurrentPage(newPage)
    fetchDocuments(newPage, itemsPerPage)
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

      console.log("Selected file:", file.name, file.type, file.size)

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
      formData.append("isPermanent", uploadForm.isPermanent.toString())
      formData.append("file", uploadForm.file)

      console.log("Uploading document:", uploadForm.name, "for user:", uploadForm.userId)

      const response = await fetch("/api/admin/documents/client/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload document")
      }

      const data = await response.json()
      console.log("Upload response:", data)

      // Reset form
      setUploadForm({
        name: "",
        description: "",
        category: "Formation",
        file: null,
        userId: "",
        isPermanent: false,
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

  // Confirm document deletion
  const confirmDelete = (doc: DocumentType) => {
    setDocumentToDelete(doc)
    setShowDeleteConfirmDialog(true)
  }

  // Handle document deletion
  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      setDeleting(true)
      console.log("Deleting document:", documentToDelete.id)

      const response = await fetch(`/api/admin/documents/client/${documentToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete document")
      }

      console.log("Delete response:", data)

      toast({
        title: "Success",
        description: "Document deleted successfully",
      })

      // Close the dialog
      setShowDeleteConfirmDialog(false)
      setDocumentToDelete(null)

      // Refresh documents
      fetchDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Handle bulk document deletion
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return

    try {
      setBulkDeleting(true)
      console.log(`Deleting ${selectedDocuments.size} documents`)

      const documentIds = Array.from(selectedDocuments)
      console.log("Document IDs to delete:", documentIds)

      const response = await fetch(`/api/admin/documents/client/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete documents")
      }

      console.log("Bulk delete response:", data)

      toast({
        title: "Success",
        description: `${selectedDocuments.size} documents deleted successfully`,
      })

      // Close the dialog and clear selections
      setShowBulkDeleteConfirm(false)
      setSelectedDocuments(new Set())

      // Refresh documents
      fetchDocuments()
    } catch (error) {
      console.error("Error deleting documents:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete documents",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  // Handle document selection for bulk actions
  const toggleDocumentSelection = (docId: string) => {
    const newSelection = new Set(selectedDocuments)
    if (newSelection.has(docId)) {
      newSelection.delete(docId)
    } else {
      newSelection.add(docId)
    }
    setSelectedDocuments(newSelection)
  }

  // Select/deselect all documents
  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      // Deselect all
      setSelectedDocuments(new Set())
    } else {
      // Select all
      const allIds = filteredDocuments.map((doc) => doc.id)
      setSelectedDocuments(new Set(allIds))
    }
  }

  // Handle document download
  const handleDownload = async (document: DocumentType) => {
    try {
      setDownloading(document.id)
      console.log("Downloading document:", document.id)

      // Show loading toast
      const loadingToast = toast({
        title: "Preparing download",
        description: "Please wait while we prepare your document...",
      })

      const response = await fetch(`/api/admin/documents/client/${document.id}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download document")
      }

      const data = await response.json()
      console.log("Download response:", data)

      if (!data.downloadUrl) {
        throw new Error("No download URL returned")
      }

      // Create a temporary link and trigger download
      const link = window.document.createElement("a")
      link.href = data.downloadUrl
      link.setAttribute("download", document.name || "document")
      link.setAttribute("target", "_blank")
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      // Show success toast
      toast({
        title: "Download started",
        description: `${document.name} is being downloaded`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
    }
  }

  // Filter documents based on search, category, and status
  const filteredDocuments = documents.filter((doc: DocumentType) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || (doc.status && selectedStatus === doc.status.toLowerCase())

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPPORT") {
        router.push("/login?callbackUrl=/admin/documents/client")
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
      } else {
        fetchDocuments(currentPage, itemsPerPage)
      }
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/documents/client")
    }
  }, [status, router, session, toast])

  if (status === "loading" || loading) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 animate-spin" />
          </div>
          <div className="absolute inset-0 border-t-3 sm:border-t-4 border-purple-500 rounded-full animate-pulse opacity-75"></div>
        </div>
        <p className="mt-4 text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">Loading documents...</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your documents</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto mb-20 md:mb-40">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Client Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
            Manage all client documents in the system
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {selectedDocuments.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center text-xs sm:text-sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Delete ({selectedDocuments.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex items-center text-xs sm:text-sm">
            <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Export
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
            onClick={() => setShowUploadDialog(true)}
          >
            <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1 text-xs sm:text-sm">
              <Filter className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Filters
            </Button>
            {error && (
              <Button variant="outline" onClick={() => fetchDocuments()} className="text-xs sm:text-sm">
                <RefreshCcw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => fetchDocuments()}>Try Again</Button>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="min-w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 sm:p-4 w-10">
                      <Checkbox
                        checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all documents"
                      />
                    </th>
                    <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Document</th>
                    <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden sm:table-cell">
                      Upload Date
                    </th>
                    <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">Type</th>
                    <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc: DocumentType) => (
                    <tr key={doc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 sm:p-4">
                        <Checkbox
                          checked={selectedDocuments.has(doc.id)}
                          onCheckedChange={() => toggleDocumentSelection(doc.id)}
                          aria-label={`Select ${doc.name}`}
                        />
                      </td>
                      <td className="p-2 sm:p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                            <FileTypeIcon
                              fileType={doc.fileType}
                              fileName={doc.name}
                              size={16}
                              className="text-gray-500"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">
                                {doc.name}
                              </p>
                              {doc.isPermanent && (
                                <span className="px-1 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center">
                                  <AlertCircle className="h-2 w-2 mr-0.5" />
                                  Permanent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">
                              {formatBytes(doc.fileSize || 0)} • <span className="md:hidden">{doc.category}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">{doc.category}</td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell text-xs sm:text-sm">
                        {doc.uploadDate
                          ? new Date(doc.uploadDate).toLocaleDateString()
                          : doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : "Unknown date"}
                      </td>
                      <td className="p-2 sm:p-4 hidden lg:table-cell">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full flex items-center w-fit ${
                            doc.status === "Verified"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : doc.status === "Pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : doc.status === "Rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}
                        >
                          {doc.status === "Verified" ? (
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          ) : doc.status === "Pending" ? (
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                          ) : doc.status === "Rejected" ? (
                            <XCircle className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {doc.status || "Pending"}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4">
                        <div className="flex space-x-1 sm:space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                          >
                            {downloading === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDownload(doc)} className="text-xs">
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 text-xs"
                                onClick={() => confirmDelete(doc)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
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
            </div>
          ) : (
            <div className="p-4 sm:p-8 text-center">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No documents found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                No documents match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-3 sm:px-4 sm:py-4 border-t text-xs sm:text-sm">
            <div className="text-gray-500 mb-3 sm:mb-0">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and pages around current page
                  return (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  )
                })
                .map((page, index, array) => {
                  // Add ellipsis if there are gaps
                  const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1
                  const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1

                  return (
                    <Fragment key={page}>
                      {showEllipsisBefore && <span className="px-1 sm:px-2">...</span>}
                      <Button
                        variant={pagination.page === page ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 sm:h-8 sm:w-8 text-xs"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                      {showEllipsisAfter && <span className="px-1 sm:px-2">...</span>}
                    </Fragment>
                  )
                })}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Upload Document</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <Label htmlFor="document-name" className="text-xs sm:text-sm">
                Document Name*
              </Label>
              <Input
                id="document-name"
                placeholder="e.g. Articles of Organization"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                required
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <Label htmlFor="document-category" className="text-xs sm:text-sm">
                Document Category*
              </Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c !== "All")
                    .map((category) => (
                      <SelectItem key={category} value={category} className="text-xs sm:text-sm">
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <Label htmlFor="document-description" className="text-xs sm:text-sm">
                Description (Optional)
              </Label>
              <Textarea
                id="document-description"
                placeholder="Brief description of the document"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="document-permanent"
                  checked={uploadForm.isPermanent}
                  onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isPermanent: checked === true })}
                />
                <Label htmlFor="document-permanent" className="text-xs sm:text-sm font-medium">
                  Document is permanent
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">Client*</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <Input
                    placeholder="Search clients by email..."
                    className="pl-9 text-xs sm:text-sm"
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
                    <div className="inline-block h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                    <span className="ml-2 text-xs text-gray-500">Searching users...</span>
                  </div>
                )}

                {!loadingUsers && users.length > 0 && (
                  <div className="max-h-40 sm:max-h-60 overflow-y-auto border rounded-md mt-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-1.5 sm:p-2 hover:bg-gray-100 cursor-pointer ${
                          selectedUserId === user.id ? "bg-purple-50" : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setUploadForm({ ...uploadForm, userId: user.id })
                        }}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] sm:text-xs text-gray-600 font-medium">
                              {user.name
                                ? user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                : user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{user.name || "Unnamed User"}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loadingUsers && searchUserQuery.length > 2 && users.length === 0 && (
                  <p className="text-xs sm:text-sm text-gray-500 py-2">No users found. Try a different search term.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">File*</Label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-6 text-center">
                <FileUp className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400">Supports PDF, DOCX, XLSX, JPG, PNG (Max 10MB)</p>
                <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button
                  variant="outline"
                  className="mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                {uploadForm.file && (
                  <div className="mt-3 sm:mt-4 text-left p-1.5 sm:p-2 bg-gray-50 rounded flex items-center gap-1.5 sm:gap-2">
                    <FileTypeIcon
                      fileType={uploadForm.file.type}
                      fileName={uploadForm.file.name}
                      size={14}
                      className="text-gray-500 flex-shrink-0"
                    />
                    <span className="text-xs truncate">{uploadForm.file.name}</span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      ({formatBytes(uploadForm.file.size)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto text-xs sm:text-sm">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm">Are you sure you want to delete this document?</p>
            {documentToDelete && (
              <div className="mt-2 p-2 sm:p-3 bg-gray-50 rounded-md">
                <p className="font-medium text-xs sm:text-sm">{documentToDelete.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {documentToDelete.category} • {formatBytes(documentToDelete.fileSize || 0)}
                </p>
              </div>
            )}
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmDialog(false)
                setDocumentToDelete(null)
              }}
              disabled={deleting}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Confirm Bulk Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm">
              Are you sure you want to delete {selectedDocuments.size} selected documents?
            </p>
            <div className="mt-2 p-2 sm:p-3 bg-gray-50 rounded-md max-h-32 sm:max-h-40 overflow-y-auto">
              <ul className="space-y-1">
                {Array.from(selectedDocuments).map((id) => {
                  const doc = documents.find((d) => d.id === id)
                  return doc ? (
                    <li key={id} className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                      <FileTypeIcon
                        fileType={doc.fileType}
                        fileName={doc.name}
                        size={12}
                        className="text-gray-500 flex-shrink-0"
                      />
                      <span className="truncate">{doc.name}</span>
                    </li>
                  ) : null
                })}
              </ul>
            </div>
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={bulkDeleting}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All Selected"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

