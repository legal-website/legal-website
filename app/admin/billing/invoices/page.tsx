"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  Mail,
  Plus,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// First, let's define a proper interface for the invoice item
interface InvoiceItem {
  name: string
  price: string
  quantity: number
}

// Then define the full invoice interface
interface Invoice {
  id: string
  customer: string
  email: string
  amount: string
  date: string
  dueDate: string
  status: string
  items: InvoiceItem[]
  paymentMethod?: string
  paymentDate?: string
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // State for new invoice form
  const [newInvoiceItems, setNewInvoiceItems] = useState<InvoiceItem[]>([{ name: "", price: "", quantity: 1 }])

  const invoices = [
    {
      id: "INV-2025-001",
      customer: "Rapid Ventures LLC",
      email: "billing@rapidventures.com",
      amount: "$1,299.00",
      date: "Mar 7, 2025",
      dueDate: "Apr 7, 2025",
      status: "Paid",
      items: [
        { name: "LLC Formation Package", price: "$199.00", quantity: 1 },
        { name: "Registered Agent Service (1 Year)", price: "$100.00", quantity: 1 },
        { name: "EIN Filing", price: "$99.00", quantity: 1 },
        { name: "Operating Agreement", price: "$99.00", quantity: 1 },
        { name: "State Filing Fee (Delaware)", price: "$90.00", quantity: 1 },
        { name: "Premium Support (1 Year)", price: "$199.00", quantity: 1 },
        { name: "Business Website Setup", price: "$499.00", quantity: 1 },
        { name: "Discount (SPRING25)", price: "-$86.00", quantity: 1 },
      ],
      paymentMethod: "Credit Card (Visa ending in 4242)",
      paymentDate: "Mar 7, 2025",
    },
    {
      id: "INV-2025-002",
      customer: "Blue Ocean Inc",
      email: "accounts@blueocean.com",
      amount: "$399.00",
      date: "Mar 6, 2025",
      dueDate: "Apr 6, 2025",
      status: "Pending",
      items: [
        { name: "Annual Report Filing", price: "$199.00", quantity: 1 },
        { name: "Registered Agent Service (1 Year)", price: "$100.00", quantity: 1 },
        { name: "State Filing Fee (California)", price: "$100.00", quantity: 1 },
      ],
    },
    {
      id: "INV-2025-003",
      customer: "Summit Solutions",
      email: "finance@summitsolutions.com",
      amount: "$849.00",
      date: "Mar 5, 2025",
      dueDate: "Apr 5, 2025",
      status: "Paid",
      items: [
        { name: "Business License Package", price: "$299.00", quantity: 1 },
        { name: "Tax ID Filing", price: "$99.00", quantity: 1 },
        { name: "Compliance Package", price: "$199.00", quantity: 1 },
        { name: "State Filing Fee (New York)", price: "$200.00", quantity: 1 },
        { name: "Expedited Processing", price: "$50.00", quantity: 1 },
        { name: "Discount (REFER50)", price: "-$50.00", quantity: 1 },
      ],
      paymentMethod: "ACH Transfer",
      paymentDate: "Mar 5, 2025",
    },
    {
      id: "INV-2025-004",
      customer: "Horizon Group",
      email: "ap@horizongroup.com",
      amount: "$599.00",
      date: "Mar 4, 2025",
      dueDate: "Apr 4, 2025",
      status: "Overdue",
      items: [
        { name: "LLC Formation Package", price: "$199.00", quantity: 1 },
        { name: "Registered Agent Service (1 Year)", price: "$100.00", quantity: 1 },
        { name: "State Filing Fee (Texas)", price: "$300.00", quantity: 1 },
      ],
    },
    {
      id: "INV-2025-005",
      customer: "Quantum Solutions",
      email: "billing@quantumsolutions.com",
      amount: "$1,099.00",
      date: "Mar 3, 2025",
      dueDate: "Apr 3, 2025",
      status: "Paid",
      items: [
        { name: "Corporation Formation Package", price: "$299.00", quantity: 1 },
        { name: "Registered Agent Service (1 Year)", price: "$100.00", quantity: 1 },
        { name: "EIN Filing", price: "$99.00", quantity: 1 },
        { name: "Corporate Bylaws", price: "$99.00", quantity: 1 },
        { name: "State Filing Fee (Nevada)", price: "$425.00", quantity: 1 },
        { name: "Corporate Kit", price: "$99.00", quantity: 1 },
        { name: "Discount (WELCOME15)", price: "-$22.00", quantity: 1 },
      ],
      paymentMethod: "Credit Card (Mastercard ending in 5678)",
      paymentDate: "Mar 3, 2025",
    },
  ]

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "paid" && invoice.status === "Paid") ||
      (activeTab === "pending" && invoice.status === "Pending") ||
      (activeTab === "overdue" && invoice.status === "Overdue") ||
      activeTab === "all"

    return matchesSearch && matchesTab
  })

  // Add proper type to the viewInvoiceDetails function
  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  // Function to handle adding a new item to the invoice
  const addInvoiceItem = () => {
    setNewInvoiceItems([...newInvoiceItems, { name: "", price: "", quantity: 1 }])
  }

  // Function to handle removing an item from the invoice
  const removeInvoiceItem = (index: number) => {
    if (newInvoiceItems.length > 1) {
      const updatedItems = [...newInvoiceItems]
      updatedItems.splice(index, 1)
      setNewInvoiceItems(updatedItems)
    }
  }

  // Function to update an invoice item
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...newInvoiceItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "quantity" ? Number(value) : value,
    }
    setNewInvoiceItems(updatedItems)
  }

  // Function to handle exporting invoices to CSV
  const exportInvoices = () => {
    // Create CSV header
    let csv = "Invoice ID,Customer,Email,Amount,Date,Due Date,Status\n"

    // Add each invoice as a row
    filteredInvoices.forEach((invoice) => {
      csv += `${invoice.id},${invoice.customer},"${invoice.email}",${invoice.amount},${invoice.date},${invoice.dueDate},${invoice.status}\n`
    })

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "invoices.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to handle creating a new invoice
  const handleCreateInvoice = () => {
    // Here you would typically send the data to your backend
    // For now, we'll just close the dialog
    setShowCreateDialog(false)

    // Reset the form
    setNewInvoiceItems([{ name: "", price: "", quantity: 1 }])
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all client invoices</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportInvoices}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreateDialog(true)}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="flex-1">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <option>Most Recent</option>
            <option>Oldest First</option>
            <option>Highest Amount</option>
            <option>Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-sm">Invoice</th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th className="text-left p-4 font-medium text-sm">Amount</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Due Date</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="p-4">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{invoice.id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{invoice.customer}</p>
                      <p className="text-sm text-gray-500">{invoice.email}</p>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{invoice.amount}</td>
                  <td className="p-4 text-gray-500">{invoice.date}</td>
                  <td className="p-4 text-gray-500">{invoice.dueDate}</td>
                  <td className="p-4">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => viewInvoiceDetails(invoice)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice.id}</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row md:justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold mb-1">Invoice</h3>
                  <p className="text-gray-500">{selectedInvoice.id}</p>
                  <div className="mt-4">
                    <p className="font-medium">Billed To:</p>
                    <p>{selectedInvoice.customer}</p>
                    <p className="text-gray-500">{selectedInvoice.email}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <InvoiceStatusBadge status={selectedInvoice.status} />
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p>{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p>{selectedInvoice.dueDate}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-sm">Item</th>
                      <th className="text-right p-2 font-medium text-sm">Price</th>
                      <th className="text-right p-2 font-medium text-sm">Quantity</th>
                      <th className="text-right p-2 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">{item.price}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">
                          {item.price.startsWith("-")
                            ? item.price
                            : `$${(Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-medium">
                        Total
                      </td>
                      <td className="p-2 text-right font-bold">{selectedInvoice.amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Information */}
              {selectedInvoice.status === "Paid" && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 mb-6">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paid on {selectedInvoice.paymentDate} via {selectedInvoice.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-end">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send to Customer
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a client. Add items and set payment terms.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input id="customer" placeholder="Enter customer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Customer Email</Label>
                <Input id="email" type="email" placeholder="Enter customer email" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input id="invoiceNumber" placeholder="INV-2025-XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input id="invoiceDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Invoice Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-sm">Item</th>
                      <th className="text-left p-2 font-medium text-sm w-1/5">Price</th>
                      <th className="text-left p-2 font-medium text-sm w-1/6">Quantity</th>
                      <th className="text-left p-2 font-medium text-sm w-1/12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newInvoiceItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateInvoiceItem(index, "name", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <span className="mr-1">$</span>
                            <Input
                              placeholder="0.00"
                              value={item.price.replace(/^\$/, "")}
                              onChange={(e) => updateInvoiceItem(index, "price", `$${e.target.value}`)}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, "quantity", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvoiceItem(index)}
                            disabled={newInvoiceItems.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="pending">
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select defaultValue="net30">
                  <SelectTrigger id="paymentTerms">
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due">Due on Receipt</SelectItem>
                    <SelectItem value="net15">Net 15 Days</SelectItem>
                    <SelectItem value="net30">Net 30 Days</SelectItem>
                    <SelectItem value="net60">Net 60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Enter any additional notes for the customer" className="h-20" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Paid
        </span>
      )
    case "Pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      )
    case "Overdue":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      )
  }
}

