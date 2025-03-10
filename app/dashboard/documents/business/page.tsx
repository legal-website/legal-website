"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Clock, Download, File, FileText, Search, Upload } from "lucide-react"

interface Document {
  id: string
  name: string
  type: string
  date: string
  size: string
  category: string
}

export default function BusinessDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const documents: Document[] = [
    {
      id: "1",
      name: "Articles of Organization",
      type: "PDF",
      date: "Jan 15, 2023",
      size: "1.2 MB",
      category: "Formation",
    },
    {
      id: "2",
      name: "Operating Agreement",
      type: "PDF",
      date: "Jan 15, 2023",
      size: "2.5 MB",
      category: "Formation",
    },
    {
      id: "3",
      name: "EIN Confirmation",
      type: "PDF",
      date: "Jan 20, 2023",
      size: "0.8 MB",
      category: "Tax",
    },
    {
      id: "4",
      name: "Annual Report 2023",
      type: "PDF",
      date: "Jul 10, 2023",
      size: "1.5 MB",
      category: "Compliance",
    },
    {
      id: "5",
      name: "Business License",
      type: "PDF",
      date: "Feb 05, 2023",
      size: "1.1 MB",
      category: "Licenses",
    },
  ]

  const categories = ["All", "Formation", "Tax", "Compliance", "Licenses", "Other"]

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const recentUpdates = [
    { text: "Annual Report 2023 was uploaded", time: "2 days ago" },
    { text: "Business License was renewed", time: "1 week ago" },
    { text: "Tax documents were updated", time: "2 weeks ago" },
  ]

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Business Documents</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">Document Library</h2>
                <Dialog>
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
                        <Label htmlFor="doc-name">Document Name</Label>
                        <Input id="doc-name" placeholder="Enter document name" />
                      </div>
                      <div>
                        <Label htmlFor="doc-category">Category</Label>
                        <select
                          id="doc-category"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {categories
                            .filter((c) => c !== "All")
                            .map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="doc-file">File</Label>
                        <Input id="doc-file" type="file" />
                      </div>
                      <Button type="submit" className="w-full">
                        Upload
                      </Button>
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
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6">
              {filteredDocuments.length > 0 ? (
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
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
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
                  <span className="text-sm font-medium">7.1 MB / 100 MB</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "7.1%" }}></div>
                </div>
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

