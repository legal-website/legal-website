"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Search,
  Download,
  Calendar,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheetIcon as FileExcel,
  FileIcon as FileWord,
  FileIcon as FilePresentation,
  FileIcon as FileDefault,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Define template type
interface Template {
  id: string
  name: string
  category: string
  updatedAt: string
  fileUrl?: string
  price: number
  pricingTier: string
}

export default function UserTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      fetchTemplates()
    } else {
      router.push("/login?callbackUrl=/dashboard/documents/templates")
    }
  }, [session, router])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/templates")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Replace the handleDownload function with this improved version
  const handleDownload = async (template: Template) => {
    try {
      let fileUrl = template.fileUrl
      let fileName = template.name.replace(/\s+/g, "-").toLowerCase()

      // If no direct fileUrl is available, try to fetch it from the API
      if (!fileUrl) {
        const response = await fetch(`/api/user/templates/${template.id}/download`)

        if (!response.ok) {
          throw new Error("Failed to download template")
        }

        const data = await response.json()
        fileUrl = data.fileUrl

        if (!fileUrl) {
          throw new Error("No file URL available")
        }
      }

      // Extract file extension from URL
      const urlExtension = fileUrl.split(".").pop()?.toLowerCase()?.split("?")[0]

      // If URL has a valid extension, use it
      if (
        urlExtension &&
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "gif"].includes(urlExtension)
      ) {
        fileName = `${fileName}.${urlExtension}`
      } else {
        // Default to PDF if no extension is found
        fileName = `${fileName}.pdf`
      }

      toast({
        title: "Download started",
        description: "Your template is being downloaded.",
      })

      // Use fetch to get the file as a blob
      const response = await fetch(fileUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const blob = await response.blob()

      // Check if the blob has content
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty")
      }

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 100)
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get file icon based on file extension
  const getFileIcon = (fileUrl: string | undefined) => {
    if (!fileUrl) return <FileDefault className="h-5 w-5 text-gray-600" />

    const extension = fileUrl.split(".").pop()?.toLowerCase().split("?")[0]

    switch (extension) {
      case "pdf":
        return <FilePdf className="h-5 w-5 text-red-600" />
      case "doc":
      case "docx":
        return <FileWord className="h-5 w-5 text-blue-600" />
      case "xls":
      case "xlsx":
        return <FileExcel className="h-5 w-5 text-green-600" />
      case "ppt":
      case "pptx":
        return <FilePresentation className="h-5 w-5 text-orange-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  // Filter templates based on search query and active tab
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "all") return matchesSearch
    if (activeTab === "business-formation") return matchesSearch && template.category === "Business Formation"
    if (activeTab === "compliance") return matchesSearch && template.category === "Compliance"
    if (activeTab === "contracts") return matchesSearch && template.category === "Contracts"
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p>Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Templates</h1>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="business-formation">Business Formation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            // Format the date
            const lastUpdated = new Date(template.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })

            return (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      {getFileIcon(template.fileUrl)}
                    </div>
                    {template.pricingTier && (
                      <Badge
                        className={
                          template.pricingTier.toLowerCase() === "free"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-purple-100 text-purple-800"
                        }
                      >
                        {template.pricingTier}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.category}</p>

                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Updated: {lastUpdated}
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleDownload(template)}
                    disabled={downloadingId === template.id}
                  >
                    {downloadingId === template.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}

