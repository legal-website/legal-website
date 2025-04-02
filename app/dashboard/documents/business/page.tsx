"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  Clock,
  Download,
  File,
  FileText,
  Search,
  RefreshCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  AlertTriangle,
  Image,
  Archive,
} from "lucide-react"
import type { Document as BusinessDocument, StorageInfo } from "@/types/document"
import React from "react"

export default function BusinessDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    limit: 100 * 1024 * 1024, // Increased to 100MB
    percentage: 0,
  })
  const [recentUpdates, setRecentUpdates] = useState<{ text: string; time: string }[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Pagination
  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  const categories = ["All", "Formation", "Tax", "Compliance", "Licenses", "Financial", "HR", "Other"]

  // Helper function to check if a document is a template
  const isTemplate = (doc: BusinessDocument): boolean => {
    // Check various conditions that might indicate a template
    const typeCheck = doc.type.toLowerCase().includes("template")
    const nameCheck = doc.name.toLowerCase().includes("template")

    // Return true if any condition is met
    return typeCheck || nameCheck
  }

  // Estimate file size based on document type and name
  const estimateFileSize = (doc: BusinessDocument): number => {
    // If the document has an actual size property, use it
    if (doc.size && typeof doc.size === "number") {
      return doc.size
    }

    // Otherwise estimate based on type and potentially content length
    const typeMap: Record<string, number> = {
      pdf: 500 * 1024, // 500KB
      doc: 300 * 1024, // 300KB
      docx: 350 * 1024, // 350KB
      xls: 250 * 1024, // 250KB
      xlsx: 300 * 1024, // 300KB
      jpg: 1.2 * 1024 * 1024, // 1.2MB
      jpeg: 1.2 * 1024 * 1024, // 1.2MB
      png: 800 * 1024, // 800KB
      txt: 50 * 1024, // 50KB
      csv: 100 * 1024, // 100KB
      ppt: 2 * 1024 * 1024, // 2MB
      pptx: 2.5 * 1024 * 1024, // 2.5MB
    }

    // Get file extension from type or from name if type is generic
    let fileExtension = doc.type.toLowerCase()

    // If type is generic (like "document"), try to extract from name
    if (fileExtension === "document" || fileExtension === "file") {
      const nameParts = doc.name.split(".")
      if (nameParts.length > 1) {
        const extractedExt = nameParts[nameParts.length - 1].toLowerCase()
        if (extractedExt in typeMap) {
          fileExtension = extractedExt
        }
      }
    }

    // Adjust size based on document name length (longer names might indicate more content)
    const baseSize = typeMap[fileExtension] || 300 * 1024 // Default to 300KB if type is unknown
    const nameMultiplier = Math.min(1.5, Math.max(0.8, doc.name.length / 20)) // Between 0.8 and 1.5

    return Math.round(baseSize * nameMultiplier)
  }

  // Calculate storage usage
  const calculateStorageUsage = (docs: BusinessDocument[]): StorageInfo => {
    const totalBytes = docs.reduce((total, doc) => total + estimateFileSize(doc), 0)
    const limit = 100 * 1024 * 1024 // 100MB limit (increased)
    const percentage = (totalBytes / limit) * 100

    return {
      used: totalBytes,
      limit,
      percentage: Math.min(percentage, 100), // Cap at 100%
    }
  }

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Get category badge color
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "formation":
        return "bg-blue-100 text-blue-800"
      case "tax":
        return "bg-green-100 text-green-800"
      case "compliance":
        return "bg-purple-100 text-purple-800"
      case "licenses":
        return "bg-amber-100 text-amber-800"
      case "financial":
        return "bg-indigo-100 text-indigo-800"
      case "hr":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get file type icon
  const getFileTypeIcon = (doc: BusinessDocument) => {
    const fileType = doc.type.toLowerCase()

    // Extract extension from filename if type is generic
    let extension = fileType
    if (fileType === "document" || fileType === "file") {
      const nameParts = doc.name.split(".")
      if (nameParts.length > 1) {
        extension = nameParts[nameParts.length - 1].toLowerCase()
      }
    }

    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileText className="h-5 w-5 text-green-600" />
      case "ppt":
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <Image className="h-5 w-5 text-purple-600" />
      case "txt":
        return <FileText className="h-5 w-5 text-gray-600" />
      case "zip":
      case "rar":
        return <Archive className="h-5 w-5 text-yellow-600" />
      default:
        return <File className="h-5 w-5 text-blue-600" />
    }
  }

  // Fetch documents and storage info
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching business documents")
      const response = await fetch("/api/user/documents/business")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch documents")
      }

      const data = await response.json()
      console.log("Received documents data:", data)

      // Filter out templates using our isTemplate helper function
      const nonTemplateDocuments = data.documents.filter((doc: BusinessDocument) => !isTemplate(doc))

      console.log(`Filtered out ${data.documents.length - nonTemplateDocuments.length} templates`)
      console.log(`Remaining documents: ${nonTemplateDocuments.length}`)

      setDocuments(nonTemplateDocuments || [])

      // Always calculate storage usage based on actual documents
      const calculatedStorageInfo = calculateStorageUsage(nonTemplateDocuments)

      // If API provides storage info, use the limit from API but calculated usage
      if (data.storage && data.storage.storageLimit) {
        calculatedStorageInfo.limit = data.storage.storageLimit
        calculatedStorageInfo.percentage = (calculatedStorageInfo.used / calculatedStorageInfo.limit) * 100
      }

      setStorageInfo(calculatedStorageInfo)

      // Update recent updates
      if (data.recentUpdates) {
        setRecentUpdates(data.recentUpdates)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError(error instanceof Error ? error.message : "Failed to load documents")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fallback download function
  const downloadWithFallback = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download with fallback: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      })
    } catch (error) {
      console.error("Fallback download failed:", error)
      throw error // Re-throw to be caught by the caller
    }
  }

  // Handle document download
  const handleDownload = async (doc: BusinessDocument) => {
    try {
      setDownloadingId(doc.id)
      console.log("Downloading document:", doc.id)

      // Check if document has a fileUrl
      if (!doc.fileUrl) {
        throw new Error("Document has no file URL")
      }

      // Determine filename with extension
      let filename = doc.name
      if (doc.type && !filename.toLowerCase().endsWith(`.${doc.type.toLowerCase()}`)) {
        filename = `${filename}.${doc.type.toLowerCase()}`
      }

      // Sanitize the filename to ensure it's valid for downloads
      filename = filename.replace(/[/\\?%*:|"<>]/g, "-")

      // Try our server-side download first
      try {
        console.log("Attempting server-side download")
        const response = await fetch(`/api/user/documents/business/${doc.id}/download`)

        // Check if the response is JSON (fallback) or a file
        const contentType = response.headers.get("content-type")

        if (contentType && contentType.includes("application/json")) {
          // This is a JSON response - likely a fallback URL
          const data = await response.json()

          if (data.fallbackUrl) {
            console.log("Using fallback URL for download:", data.fallbackUrl)

            // Try to download using a different approach
            await downloadWithFallback(data.fallbackUrl, filename)
            return
          } else if (data.error) {
            throw new Error(data.error)
          }
        }

        if (!response.ok) {
          // Try to parse error response as JSON
          try {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to download document")
          } catch (jsonError) {
            // If not JSON, use status text
            throw new Error(`Failed to download document: ${response.status} ${response.statusText}`)
          }
        }

        // Get the blob from the response
        const blob = await response.blob()

        // Check if we got a valid file (not HTML)
        if (blob.type === "text/html") {
          const text = await blob.text()
          if (text.includes("<html") || text.includes("<!DOCTYPE html")) {
            console.error("Received HTML instead of file")
            throw new Error("Received HTML instead of file content")
          }
        }

        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob)

        // Create a temporary link element
        const link = window.document.createElement("a")
        link.href = url
        link.download = filename

        // Append to the document, click it, and remove it
        window.document.body.appendChild(link)
        link.click()

        // Clean up
        window.document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: "Document downloaded successfully",
        })
      } catch (serverError) {
        console.error("Server-side download failed:", serverError)

        // Try direct download as fallback
        await downloadWithFallback(doc.fileUrl, filename)
      }
    } catch (error) {
      console.error("All download methods failed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40">
      <h1 className="text-3xl font-bold mb-6">My Documents</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">Document Library</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocuments}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                  {error && (
                    <Button variant="outline" size="sm" onClick={fetchDocuments} className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b">
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
                <div className="w-full sm:w-auto">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-700 text-center">
                    Loading your documents...
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">This may take a moment</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">Error Loading Documents</h3>
                  <p className="text-gray-500 mt-1 mb-4">{error}</p>
                  <Button onClick={fetchDocuments}>Try Again</Button>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                      >
                        <div className="flex items-start sm:items-center gap-3 w-full">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">{getFileTypeIcon(doc)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium truncate max-w-full sm:max-w-xs md:max-w-sm">{doc.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(doc.category)}`}>
                                {doc.category}
                              </span>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mb-1 line-clamp-2">{doc.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                              <span>{doc.type.toUpperCase()}</span>
                              <span className="hidden xs:inline">•</span>
                              <span>{formatBytes(estimateFileSize(doc))}</span>
                              <span className="hidden xs:inline">•</span>
                              <span>
                                {doc.createdAt instanceof Date
                                  ? doc.createdAt.toLocaleDateString()
                                  : new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="w-full sm:w-auto"
                          >
                            {downloadingId === doc.id ? (
                              <>
                                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
                    <p className="text-sm text-gray-500 text-center sm:text-left">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length}{" "}
                      documents
                    </p>
                    <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // On mobile, show fewer page numbers
                          if (typeof window !== "undefined" && window.innerWidth < 640) {
                            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                          }
                          return true
                        })
                        .map((page, index, array) => {
                          // Add ellipsis
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <React.Fragment key={`ellipsis-${page}`}>
                                <span className="px-2">...</span>
                                <Button
                                  variant={page === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            )
                          }
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchTerm || selectedCategory !== "All"
                      ? "Try adjusting your search or filters"
                      : "No documents have been uploaded by your account manager yet"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Updates</h3>
            </div>
            <div className="p-4 sm:p-6">
              {recentUpdates.length > 0 ? (
                <div className="space-y-4">
                  {recentUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm break-words">{update.text}</p>
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

          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <h3 className="text-lg font-semibold">Document Storage</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Used Storage</span>
                  <span className="text-sm font-medium">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
                  </span>
                </div>
                <Progress
                  value={storageInfo.percentage}
                  className={`h-2 ${storageInfo.percentage > 90 ? "[&>div]:bg-red-500" : ""}`}
                />

                {storageInfo.percentage > 90 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800">Storage Almost Full</h4>
                        <p className="text-sm text-red-700 mt-1">
                          You've used {storageInfo.percentage.toFixed(1)}% of your storage. Please contact your account
                          manager to request additional storage.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                      <HardDrive className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium truncate">Total Documents</span>
                  </div>
                  <span className="text-sm font-bold ml-2">{documents.length}</span>
                </div>

                {categories
                  .filter((cat) => cat !== "All")
                  .map((category) => {
                    const count = documents.filter((doc) => doc.category === category).length
                    if (count === 0) return null

                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-full ${getCategoryColor(category)} flex-shrink-0`}>
                            <Tag className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium truncate">{category}</span>
                        </div>
                        <span className="text-sm font-bold ml-2">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

