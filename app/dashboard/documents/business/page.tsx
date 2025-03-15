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
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Document as BusinessDocument, StorageInfo } from "@/types/document"

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
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

  // Pagination
  const itemsPerPage = 20
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

  // Estimate file size based on document type
  const estimateFileSize = (doc: BusinessDocument): number => {
    // This is a rough estimate, in a real app you would store the actual file size
    const typeMap: Record<string, number> = {
      pdf: 500 * 1024, // 500KB
      doc: 300 * 1024, // 300KB
      docx: 300 * 1024, // 300KB
      xls: 250 * 1024, // 250KB
      xlsx: 250 * 1024, // 250KB
      jpg: 1 * 1024 * 1024, // 1MB
      png: 800 * 1024, // 800KB
      txt: 50 * 1024, // 50KB
    }

    const fileExtension = doc.type.toLowerCase()
    return typeMap[fileExtension] || 300 * 1024 // Default to 300KB if type is unknown
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

      // Calculate storage usage
      const storageInfo = calculateStorageUsage(nonTemplateDocuments)
      setStorageInfo(storageInfo)

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

  // Handle document download
  const handleDownload = async (doc: BusinessDocument) => {
    try {
      setDownloadingId(doc.id)
      console.log("Downloading document:", doc.id)

      const response = await fetch(`/api/user/documents/business/${doc.id}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download document")
      }

      const data = await response.json()
      console.log("Download response:", data)

      // Create a temporary link and trigger download
      if (typeof window !== "undefined") {
        // For direct download, we'll use a different approach
        // Create a hidden anchor element
        const link = window.document.createElement("a")

        // Set the href to the download URL
        link.href = data.downloadUrl

        // Set the download attribute with the document name
        let filename = doc.name

        // Add file extension if not present
        const fileExtension = doc.type.toLowerCase()
        if (fileExtension && !filename.toLowerCase().endsWith(`.${fileExtension}`)) {
          filename = `${filename}.${fileExtension}`
        }

        link.setAttribute("download", filename)

        // Set target to _blank to open in a new tab as a fallback
        link.setAttribute("target", "_blank")

        // Add to body, click, and remove
        window.document.body.appendChild(link)
        link.click()

        // Small delay before removing the link
        setTimeout(() => {
          window.document.body.removeChild(link)
        }, 100)

        toast({
          title: "Download Started",
          description:
            "Your document download has started. If it doesn't download automatically, check your browser settings.",
        })
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  // Handle document selection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId)
      } else {
        return [...prev, docId]
      }
    })
  }

  // Handle select all documents
  const toggleSelectAll = () => {
    if (selectedDocuments.length === paginatedDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(paginatedDocuments.map((doc) => doc.id))
    }
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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedDocuments([])
  }

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
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Business Documents</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">Document Library</h2>
                <div className="flex gap-2">
                  {error && (
                    <Button variant="outline" size="sm" onClick={fetchDocuments} className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-700">Loading your documents...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
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
                  <div className="mb-4 flex items-center">
                    <Checkbox
                      id="select-all"
                      checked={selectedDocuments.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="mr-2"
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-600">
                      Select all on this page
                    </label>
                  </div>
                  <div className="space-y-4">
                    {paginatedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`doc-${doc.id}`}
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={() => toggleDocumentSelection(doc.id)}
                            className="mr-2"
                          />
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{doc.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(doc.category)}`}>
                                {doc.category}
                              </span>
                            </div>
                            {doc.description && <p className="text-sm text-gray-600 mb-1">{doc.description}</p>}
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{doc.type.toUpperCase()}</span>
                              <span>•</span>
                              <span>{formatBytes(estimateFileSize(doc))}</span>
                              <span>•</span>
                              <span>
                                {doc.createdAt instanceof Date
                                  ? doc.createdAt.toLocaleDateString()
                                  : new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length}{" "}
                        documents
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
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
                  )}
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
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <HardDrive className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Total Documents</span>
                  </div>
                  <span className="text-sm font-bold">{documents.length}</span>
                </div>

                {categories
                  .filter((cat) => cat !== "All")
                  .map((category) => {
                    const count = documents.filter((doc) => doc.category === category).length
                    if (count === 0) return null

                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getCategoryColor(category)}`}>
                            <Tag className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{category}</span>
                        </div>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </Card>

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
        </div>
      </div>
    </div>
  )
}

