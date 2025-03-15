"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Download, File, FileText, Search, Building } from "lucide-react"
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
  sharedBy: {
    name: string
    email: string
  }
  sharedAt: string
}

export default function ClientDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBusiness, setSelectedBusiness] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [documents, setDocuments] = useState<Document[]>([])
  const [businesses, setBusinesses] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Fetch shared documents
  const fetchSharedDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/documents/shared")

      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data.documents || [])

      // Extract unique businesses and categories
      const uniqueBusinesses = ["All", ...new Set(data.documents.map((doc: Document) => doc.businessName))] as string[]
      const uniqueCategories = ["All", ...new Set(data.documents.map((doc: Document) => doc.category))] as string[]

      setBusinesses(uniqueBusinesses)
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching shared documents:", error)
      toast({
        title: "Error",
        description: "Failed to load shared documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle document download
  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/user/documents/shared/${document.id}/download`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to download document")
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      // Fix: Use the window.document object instead of the Document interface
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

  // Filter documents based on search, business, and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBusiness = selectedBusiness === "All" || doc.businessName === selectedBusiness
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory

    return matchesSearch && matchesBusiness && matchesCategory
  })

  // Load documents on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchSharedDocuments()
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
      <h1 className="text-3xl font-bold mb-6">Shared Documents</h1>

      <Card className="mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Documents Shared With You</h2>
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
                {businesses.map((business) => (
                  <SelectItem key={business} value={business}>
                    {business}
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
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Shared {new Date(doc.sharedAt).toLocaleDateString()}</span>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
              <p className="text-gray-500 mt-1">No documents have been shared with you yet.</p>
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
                    <p className="text-gray-500">Shared By</p>
                    <p>{selectedDocument.sharedBy.name || selectedDocument.sharedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Shared On</p>
                    <p>{new Date(selectedDocument.sharedAt).toLocaleDateString()}</p>
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
    </div>
  )
}

