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
import { AlertCircle, Clock, Download, File, FileText, Search, RefreshCcw } from "lucide-react"
import type { Document, StorageInfo, DocumentActivity } from "@/types/document"

export default function BusinessDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ used: 0, limit: 104857600, percentage: 0 })
  const [recentUpdates, setRecentUpdates] = useState<{ text: string; time: string }[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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
      setError(null)

      console.log("Fetching business documents")
      const response = await fetch("/api/user/documents/business")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch documents")
      }

      const data = await response.json()
      console.log("Received documents data:", data)

      // ONLY show documents that were uploaded by an admin AND are not templates
      const adminDocuments = data.documents.filter(
        (doc: Document) => doc.uploadedByAdmin === true && doc.type !== "template" && doc.fileType !== "template",
      )

      setDocuments(adminDocuments || [])

      // Update storage info
      if (data.storage) {
        const used = data.storage.totalStorageBytes
        const limit = data.storage.storageLimit
        const percentage = (used / limit) * 100
        setStorageInfo({ used, limit, percentage })
      }

      // Update recent updates - only for admin documents
      if (data.recentUpdates) {
        const adminUpdates = data.recentUpdates.filter(
          (update: DocumentActivity, index: number) => index < adminDocuments.length,
        )
        setRecentUpdates(adminUpdates)
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
  const handleDownload = async (document: Document) => {
    try {
      setDownloadingId(document.id)
      console.log("Downloading document:", document.id)

      const response = await fetch(`/api/user/documents/business/${document.id}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download document")
      }

      const data = await response.json()
      console.log("Download response:", data)

      // Create a temporary link and trigger download
      if (typeof window !== "undefined") {
        const link = window.document.createElement("a")
        link.href = data.downloadUrl
        link.setAttribute("download", document.name)
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      }

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      })
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
                {error && (
                  <Button variant="outline" size="sm" onClick={fetchDocuments} className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </Button>
                )}
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
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">Error Loading Documents</h3>
                  <p className="text-gray-500 mt-1 mb-4">{error}</p>
                  <Button onClick={fetchDocuments}>Try Again</Button>
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
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{(doc.fileType || doc.type || "Unknown").toUpperCase()}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.fileSize || 0)}</span>
                            <span>•</span>
                            <span>
                              {doc.uploadDate
                                ? new Date(doc.uploadDate).toLocaleDateString()
                                : doc.createdAt
                                  ? new Date(doc.createdAt).toLocaleDateString()
                                  : "Unknown date"}
                            </span>
                          </div>
                          {doc.description && <p className="text-sm text-gray-500 mt-1">{doc.description}</p>}
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
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>Storage almost full! Please contact support for more storage.</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Document Retention</h4>
                    <p className="text-sm text-amber-700">
                      Keep your business documents for at least 7 years. Some documents like formation documents should
                      be kept permanently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

