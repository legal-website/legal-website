"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, CreditCard, FileText, Lock, Search, ShoppingCart } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  category: string
  isPurchased: boolean
}

export default function DocumentTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Operating Agreement",
      description: "Comprehensive operating agreement template for LLCs",
      category: "Formation",
      isPurchased: true,
    },
    {
      id: "2",
      name: "Employment Agreement",
      description: "Standard employment agreement for hiring employees",
      category: "HR",
      isPurchased: false,
    },
    {
      id: "3",
      name: "Non-Disclosure Agreement",
      description: "Protect your business information with this NDA template",
      category: "Legal",
      isPurchased: false,
    },
    {
      id: "4",
      name: "Independent Contractor Agreement",
      description: "Agreement for hiring contractors and freelancers",
      category: "HR",
      isPurchased: false,
    },
    {
      id: "5",
      name: "Business Plan Template",
      description: "Comprehensive business plan template with financial projections",
      category: "Planning",
      isPurchased: false,
    },
    {
      id: "6",
      name: "Invoice Template",
      description: "Professional invoice template for your business",
      category: "Finance",
      isPurchased: true,
    },
  ])

  const categories = ["All", "Formation", "HR", "Legal", "Planning", "Finance"]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handlePurchase = (id: string) => {
    // In a real app, this would handle payment processing
    setTemplates(templates.map((template) => (template.id === id ? { ...template, isPurchased: true } : template)))
  }

  return (
    <div className="p-8 -mb-40">
      <h1 className="text-3xl font-bold mb-6">Document Templates</h1>

      <Card className="mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Premium Templates</h2>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">Unlock all templates for $99</span>
              <Button size="sm" className="ml-2">
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Buy All
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="p-6 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{template.category}</span>
                    {template.isPurchased ? (
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                            Unlock $19
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Purchase Template</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">{template.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Card Information</label>
                                <div className="mt-1 relative">
                                  <Input placeholder="Card number" />
                                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="MM/YY" />
                                <Input placeholder="CVC" />
                              </div>

                              <Button
                                className="w-full"
                                onClick={() => {
                                  handlePurchase(template.id)
                                }}
                              >
                                Pay $19
                              </Button>

                              <p className="text-xs text-center text-gray-500">
                                Or unlock all templates for $99 and save
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* Blur overlay for unpurchased templates */}
                  {!template.isPurchased && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <Button size="sm" onClick={() => handlePurchase(template.id)}>
                          Unlock for $19
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Template Benefits</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Attorney-Drafted</h3>
              <p className="text-sm text-gray-600">All templates are drafted by experienced business attorneys</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Regularly Updated</h3>
              <p className="text-sm text-gray-600">Templates are updated to reflect current laws and regulations</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Customizable</h3>
              <p className="text-sm text-gray-600">Easily customize templates to fit your specific business needs</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

