"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Download,
  Plus,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  FileUp,
  Mail,
  Building,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import Image from "next/image"

// Define types for our data
interface DocumentTag {
  id: string
  name: string
  color: string
}

interface DocumentVersion {
  id: string
  version: string
  uploadedBy: string
  uploadedAt: string
  fileSize: string
}

interface DocumentData {
  id: string
  name: string
  type: string
  company: string
  companyId: string
  owner: {
    name: string
    email: string
    profileImage?: string
  }
  uploadDate: string
  lastModified: string
  status: "Verified" | "Pending" | "Rejected"
  fileSize: string
  fileType: "pdf" | "docx" | "xlsx" | "jpg" | "png"
  tags: DocumentTag[]
  versions?: DocumentVersion[]
  notes?: string
  sharedWith?: string[]
}

export default function ClientDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCompany, setSelectedCompany] = useState("All Companies")
  const [selectedDocType, setSelectedDocType] = useState("All Types")
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Sample document tags
  const documentTags: DocumentTag[] = [
    { id: "1", name: "Important", color: "red" },
    { id: "2", name: "Compliance", color: "blue" },
    { id: "3", name: "Tax", color: "green" },
    { id: "4", name: "Legal", color: "purple" },
    { id: "5", name: "Financial", color: "amber" },
    { id: "6", name: "HR", color: "pink" },
  ]

  // Sample documents data
  const documents: DocumentData[] = [
    {
      id: "doc1",
      name: "Articles of Organization",
      type: "Legal",
      company: "Rapid Ventures LLC",
      companyId: "comp1",
      owner: {
        name: "Sarah Johnson",
        email: "sarah@rapidventures.com",
      },
      uploadDate: "Jan 15, 2023",
      lastModified: "Jan 15, 2023",
      status: "Verified",
      fileSize: "1.2 MB",
      fileType: "pdf",
      tags: [documentTags[2], documentTags[3]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Sarah Johnson",
          uploadedAt: "Jan 15, 2023",
          fileSize: "1.2 MB",
        },
      ],
      notes: "Original filing document for Rapid Ventures LLC",
    },
    {
      id: "doc2",
      name: "Operating Agreement",
      type: "Legal",
      company: "Rapid Ventures LLC",
      companyId: "comp1",
      owner: {
        name: "Sarah Johnson",
        email: "sarah@rapidventures.com",
      },
      uploadDate: "Jan 15, 2023",
      lastModified: "Jan 15, 2023",
      status: "Verified",
      fileSize: "2.5 MB",
      fileType: "pdf",
      tags: [documentTags[3]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Sarah Johnson",
          uploadedAt: "Jan 15, 2023",
          fileSize: "2.5 MB",
        },
      ],
    },
    {
      id: "doc3",
      name: "EIN Confirmation",
      type: "Tax",
      company: "Rapid Ventures LLC",
      companyId: "comp1",
      owner: {
        name: "Sarah Johnson",
        email: "sarah@rapidventures.com",
      },
      uploadDate: "Jan 20, 2023",
      lastModified: "Jan 20, 2023",
      status: "Verified",
      fileSize: "0.8 MB",
      fileType: "pdf",
      tags: [documentTags[2]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Sarah Johnson",
          uploadedAt: "Jan 20, 2023",
          fileSize: "0.8 MB",
        },
      ],
    },
    {
      id: "doc4",
      name: "Annual Report 2024",
      type: "Compliance",
      company: "Rapid Ventures LLC",
      companyId: "comp1",
      owner: {
        name: "Sarah Johnson",
        email: "sarah@rapidventures.com",
      },
      uploadDate: "Mar 7, 2025",
      lastModified: "Mar 7, 2025",
      status: "Pending",
      fileSize: "1.5 MB",
      fileType: "pdf",
      tags: [documentTags[1]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Sarah Johnson",
          uploadedAt: "Mar 7, 2025",
          fileSize: "1.5 MB",
        },
      ],
      notes: "Awaiting verification by compliance team",
    },
    {
      id: "doc5",
      name: "Articles of Organization",
      type: "Legal",
      company: "Blue Ocean Inc",
      companyId: "comp2",
      owner: {
        name: "Michael Chen",
        email: "michael@blueocean.com",
      },
      uploadDate: "Feb 10, 2023",
      lastModified: "Feb 10, 2023",
      status: "Verified",
      fileSize: "1.3 MB",
      fileType: "pdf",
      tags: [documentTags[2], documentTags[3]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Michael Chen",
          uploadedAt: "Feb 10, 2023",
          fileSize: "1.3 MB",
        },
      ],
    },
    {
      id: "doc6",
      name: "Operating Agreement",
      type: "Legal",
      company: "Blue Ocean Inc",
      companyId: "comp2",
      owner: {
        name: "Michael Chen",
        email: "michael@blueocean.com",
      },
      uploadDate: "Feb 10, 2023",
      lastModified: "Feb 10, 2023",
      status: "Verified",
      fileSize: "2.2 MB",
      fileType: "pdf",
      tags: [documentTags[3]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Michael Chen",
          uploadedAt: "Feb 10, 2023",
          fileSize: "2.2 MB",
        },
      ],
    },
    {
      id: "doc7",
      name: "Tax Filing Q1",
      type: "Tax",
      company: "Blue Ocean Inc",
      companyId: "comp2",
      owner: {
        name: "Michael Chen",
        email: "michael@blueocean.com",
      },
      uploadDate: "Mar 5, 2025",
      lastModified: "Mar 5, 2025",
      status: "Pending",
      fileSize: "3.1 MB",
      fileType: "pdf",
      tags: [documentTags[2], documentTags[0]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Michael Chen",
          uploadedAt: "Mar 5, 2025",
          fileSize: "3.1 MB",
        },
      ],
      notes: "Quarterly tax filing for Q1 2025",
    },
    {
      id: "doc8",
      name: "Business License",
      type: "Compliance",
      company: "Summit Solutions",
      companyId: "comp3",
      owner: {
        name: "Emily Rodriguez",
        email: "emily@summitsolutions.com",
      },
      uploadDate: "Mar 10, 2023",
      lastModified: "Mar 10, 2023",
      status: "Verified",
      fileSize: "1.1 MB",
      fileType: "pdf",
      tags: [documentTags[1], documentTags[3]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Emily Rodriguez",
          uploadedAt: "Mar 10, 2023",
          fileSize: "1.1 MB",
        },
      ],
    },
    {
      id: "doc9",
      name: "Employee Handbook",
      type: "HR",
      company: "Summit Solutions",
      companyId: "comp3",
      owner: {
        name: "Emily Rodriguez",
        email: "emily@summitsolutions.com",
      },
      uploadDate: "Apr 5, 2023",
      lastModified: "Feb 15, 2025",
      status: "Verified",
      fileSize: "4.5 MB",
      fileType: "docx",
      tags: [documentTags[5]],
      versions: [
        {
          id: "v2",
          version: "2.0",
          uploadedBy: "Emily Rodriguez",
          uploadedAt: "Feb 15, 2025",
          fileSize: "4.5 MB",
        },
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "Emily Rodriguez",
          uploadedAt: "Apr 5, 2023",
          fileSize: "4.2 MB",
        },
      ],
      notes: "Updated with new policies in February 2025",
    },
    {
      id: "doc10",
      name: "Financial Statement 2024",
      type: "Financial",
      company: "Horizon Group",
      companyId: "comp4",
      owner: {
        name: "David Kim",
        email: "david@horizongroup.com",
      },
      uploadDate: "Feb 10, 2025",
      lastModified: "Feb 10, 2025",
      status: "Rejected",
      fileSize: "2.8 MB",
      fileType: "xlsx",
      tags: [documentTags[4]],
      versions: [
        {
          id: "v1",
          version: "1.0",
          uploadedBy: "David Kim",
          uploadedAt: "Feb 10, 2025",
          fileSize: "2.8 MB",
        },
      ],
      notes: "Rejected due to missing information. Please resubmit with complete data.",
    },
  ]

  // Get unique companies and document types for filters
  const companies = ["All Companies", ...Array.from(new Set(documents.map((doc) => doc.company)))]
  const documentTypes = ["All Types", ...Array.from(new Set(documents.map((doc) => doc.type)))]

  // Filter documents based on search query, tab, company, and document type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "verified" && doc.status === "Verified") ||
      (activeTab === "pending" && doc.status === "Pending") ||
      (activeTab === "rejected" && doc.status === "Rejected") ||
      activeTab === "all"

    const matchesCompany = selectedCompany === "All Companies" || doc.company === selectedCompany
    const matchesType = selectedDocType === "All Types" || doc.type === selectedDocType

    return matchesSearch && matchesTab && matchesCompany && matchesType
  })

  const viewDocumentDetails = (document: DocumentData) => {
    setSelectedDocument(document)
    setShowDocumentDialog(true)
  }

  // Function to export documents data as CSV
  const exportDocumentsData = () => {
    // Define CSV headers
    const headers = [
      "Document ID",
      "Document Name",
      "Type",
      "Company",
      "Owner Name",
      "Owner Email",
      "Upload Date",
      "Last Modified",
      "Status",
      "File Size",
      "File Type",
      "Tags",
      "Notes",
    ].join(",")

    // Convert each document to CSV row
    const csvRows = filteredDocuments.map((doc) => {
      const tags = doc.tags.map((tag) => tag.name).join("; ")
      const notes = doc.notes ? doc.notes.replace(/,/g, ";").replace(/\n/g, " ") : ""

      return [
        doc.id,
        doc.name.replace(/,/g, ";"),
        doc.type,
        doc.company.replace(/,/g, ";"),
        doc.owner.name.replace(/,/g, ";"),
        doc.owner.email,
        doc.uploadDate,
        doc.lastModified,
        doc.status,
        doc.fileSize,
        doc.fileType.toUpperCase(),
        tags,
        notes,
      ].join(",")
    })

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join("\n")

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    // Set link properties
    const date = new Date().toISOString().split("T")[0]
    link.setAttribute("href", url)
    link.setAttribute("download", `client-documents-${date}.csv`)
    link.style.visibility = "hidden"

    // Add link to document, trigger click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportDocumentsData}>
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
          <select
            className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DocumentsTable documents={filteredDocuments} viewDocumentDetails={viewDocumentDetails} />
        </TabsContent>

        <TabsContent value="verified">
          <DocumentsTable documents={filteredDocuments} viewDocumentDetails={viewDocumentDetails} />
        </TabsContent>

        <TabsContent value="pending">
          <DocumentsTable documents={filteredDocuments} viewDocumentDetails={viewDocumentDetails} />
        </TabsContent>

        <TabsContent value="rejected">
          <DocumentsTable documents={filteredDocuments} viewDocumentDetails={viewDocumentDetails} />
        </TabsContent>
      </Tabs>

      {/* Document Details Dialog */}
      {selectedDocument && (
        <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription>Detailed information about {selectedDocument.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Document Preview */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <FileText className="h-12 w-12 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium">{selectedDocument.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {selectedDocument.fileType.toUpperCase()} • {selectedDocument.fileSize}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full flex items-center ${
                          selectedDocument.status === "Verified"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : selectedDocument.status === "Pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {selectedDocument.status === "Verified" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : selectedDocument.status === "Pending" ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {selectedDocument.status}
                      </span>

                      <div className="mt-6 w-full">
                        <Button variant="outline" className="w-full mb-2">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:w-2/3 space-y-6">
                  {/* Document Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Document Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Document Type</p>
                        <p className="font-medium">{selectedDocument.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                        <p className="font-medium">{selectedDocument.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload Date</p>
                        <p className="font-medium">{selectedDocument.uploadDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Modified</p>
                        <p className="font-medium">{selectedDocument.lastModified}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDocument.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={`px-2 py-0.5 text-xs rounded-full bg-${tag.color}-100 text-${tag.color}-800 dark:bg-${tag.color}-900/30 dark:text-${tag.color}-400`}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Owner Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Owner Information</h3>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        {selectedDocument.owner.profileImage ? (
                          <Image
                            src={selectedDocument.owner.profileImage || "/placeholder.svg"}
                            alt={selectedDocument.owner.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {selectedDocument.owner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{selectedDocument.owner.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedDocument.owner.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Building className="h-3 w-3 mr-1" />
                          {selectedDocument.company}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Versions and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Versions */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Version History</h3>
                  </div>
                  <div className="p-4">
                    {selectedDocument.versions && selectedDocument.versions.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDocument.versions.map((version) => (
                          <div key={version.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-2">
                                <span className="text-xs font-medium">{version.version}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Version {version.version}</p>
                                <p className="text-xs text-gray-500">
                                  {version.uploadedBy} • {version.uploadedAt}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No version history available</p>
                    )}
                  </div>
                </Card>

                {/* Notes */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Notes</h3>
                  </div>
                  <div className="p-4">
                    {selectedDocument.notes ? (
                      <p className="text-sm">{selectedDocument.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notes available</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
                Close
              </Button>
              {selectedDocument.status === "Pending" && (
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify Document
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document for a client</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-name" className="text-right">
                Document Name
              </Label>
              <Input id="document-name" placeholder="e.g. Articles of Organization" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-type" className="text-right">
                Document Type
              </Label>
              <select
                id="document-type"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {documentTypes
                  .filter((t) => t !== "All Types")
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <select
                id="company"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {companies
                  .filter((c) => c !== "All Companies")
                  .map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">File</Label>
              <div className="col-span-3">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-gray-400">Supports PDF, DOCX, XLSX, JPG, PNG (Max 10MB)</p>
                  <input type="file" className="hidden" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {documentTags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`px-2 py-1 text-xs rounded-full bg-${tag.color}-100 text-${tag.color}-800 dark:bg-${tag.color}-900/30 dark:text-${tag.color}-400 flex items-center cursor-pointer hover:bg-${tag.color}-200 dark:hover:bg-${tag.color}-900/50`}
                    >
                      <span>{tag.name}</span>
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes (Optional)
              </Label>
              <Input id="notes" placeholder="Additional notes about this document" className="col-span-3" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Upload Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// DocumentsTable component to display the documents
const DocumentsTable = ({
  documents,
  viewDocumentDetails,
}: {
  documents: DocumentData[]
  viewDocumentDetails: (doc: DocumentData) => void
}) => {
  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No documents match your current filters. Try adjusting your search criteria.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-sm">Document</th>
              <th className="text-left p-4 font-medium text-sm">Company</th>
              <th className="text-left p-4 font-medium text-sm">Owner</th>
              <th className="text-left p-4 font-medium text-sm">Upload Date</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Tags</th>
              <th className="text-left p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.fileSize} • {doc.fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{doc.company}</td>
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                      {doc.owner.profileImage ? (
                        <Image
                          src={doc.owner.profileImage || "/placeholder.svg"}
                          alt={doc.owner.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {doc.owner.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.owner.name}</p>
                      <p className="text-xs text-gray-500">{doc.owner.email}</p>
                    </div>
                  </div>
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
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`px-2 py-0.5 text-xs rounded-full bg-${tag.color}-100 text-${tag.color}-800 dark:bg-${tag.color}-900/30 dark:text-${tag.color}-400`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => viewDocumentDetails(doc)}>
                      <Eye className="h-4 w-4" />
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
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        {doc.status === "Pending" && (
                          <DropdownMenuItem className="text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Verify
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
      </div>
    </Card>
  )
}

