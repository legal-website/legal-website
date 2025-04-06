"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

// Invoice types
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
  templateId?: string
  type?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: string
  items: InvoiceItem[] | string
  paymentReceipt?: string
  paymentDate?: string
  createdAt: string
  updatedAt: string
  isTemplateInvoice?: boolean
}

// Annual Report types
interface Filing {
  id: string
  deadlineId: string
  deadlineTitle?: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  userNotes: string | null
  adminNotes: string | null
  filedDate: string | null
  dueDate?: string
  createdAt?: string
  deadline?: {
    title: string
    dueDate: string
  } | null
}

// Amendment types
interface Amendment {
  id: string
  type: string
  details: string
  status: string
  createdAt: string
  updatedAt: string
  documentUrl?: string
  receiptUrl?: string
  paymentAmount?: number | string
  notes?: string
}

// Mock data for annual reports
const mockFilings: Filing[] = [
  {
    id: "1",
    deadlineId: "d1",
    deadlineTitle: "Annual Report 2023",
    receiptUrl: null,
    reportUrl: "/sample-report.pdf",
    status: "completed",
    userNotes: "Filed on time",
    adminNotes: "Processed and approved",
    filedDate: "2023-04-15T10:00:00Z",
    dueDate: "2023-05-01T00:00:00Z",
    createdAt: "2023-03-01T09:00:00Z",
  },
  {
    id: "2",
    deadlineId: "d2",
    deadlineTitle: "Biennial Report 2022",
    receiptUrl: "/sample-receipt.pdf",
    reportUrl: "/sample-report.pdf",
    status: "completed",
    userNotes: null,
    adminNotes: "Processed and approved",
    filedDate: "2022-04-10T11:30:00Z",
    dueDate: "2022-05-01T00:00:00Z",
    createdAt: "2022-03-15T14:00:00Z",
  },
]

// Mock data for amendments
const mockAmendments: Amendment[] = [
  {
    id: "1",
    type: "Change of Registered Agent",
    details: "Updated registered agent to ABC Services",
    status: "approved",
    createdAt: "2023-06-10T09:00:00Z",
    updatedAt: "2023-06-15T14:30:00Z",
    documentUrl: "/sample-document.pdf",
    receiptUrl: "/sample-receipt.pdf",
    paymentAmount: 49.0,
  },
  {
    id: "2",
    type: "Name Change",
    details: "Changed business name from 'ABC LLC' to 'XYZ Enterprises LLC'",
    status: "amendment_resolved",
    createdAt: "2023-08-05T11:00:00Z",
    updatedAt: "2023-08-12T16:45:00Z",
    documentUrl: "/sample-document.pdf",
    receiptUrl: "/sample-receipt.pdf",
    paymentAmount: 79.0,
    notes: "Name change approved by state",
  },
]

export default function BusinessOrdersPage() {
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true)
        setInvoiceError(null)

        const response = await fetch("/api/user/business-orders", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Process the invoices to ensure items are properly parsed
        const processedInvoices = data.invoices.map((invoice: any) => {
          // Parse items if they're stored as a JSON string
          let parsedItems = invoice.items
          try {
            if (typeof invoice.items === "string") {
              parsedItems = JSON.parse(invoice.items)
            }
          } catch (e) {
            console.error(`Error parsing items for invoice ${invoice.id}:`, e)
            parsedItems = []
          }

          return {
            ...invoice,
            items: parsedItems,
          }
        })

        console.log("All processed invoices:", processedInvoices)
        setInvoices(processedInvoices)
      } catch (error: any) {
        console.error("Error fetching invoices:", error)
        setInvoiceError(error.message || "Failed to load invoices")
        toast({
          title: "Error",
          description: `Failed to load invoices: ${error.message || "Unknown error"}`,
          variant: "destructive",
        })

        // Set fallback data for development/demo purposes
        const fallbackInvoices = [
          {
            id: "1",
            invoiceNumber: "INV-2023-001",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            amount: 349.0,
            status: "paid",
            items: [
              { id: "1", tier: "LLC Formation Package", price: 199.0 },
              { id: "2", tier: "EIN Filing", price: 99.0 },
              { id: "3", tier: "Operating Agreement", price: 51.0 },
            ],
            createdAt: "2023-01-15T12:00:00Z",
            updatedAt: "2023-01-15T12:30:00Z",
            paymentDate: "2023-01-15T12:30:00Z",
          },
          {
            id: "2",
            invoiceNumber: "INV-2023-045",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            amount: 99.0,
            status: "paid",
            items: [{ id: "4", tier: "Annual Report Filing", price: 99.0 }],
            createdAt: "2023-03-22T10:00:00Z",
            updatedAt: "2023-03-22T10:15:00Z",
            paymentDate: "2023-03-22T10:15:00Z",
          },
          {
            id: "3",
            invoiceNumber: "TEMP-2023-012",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            amount: 49.0,
            status: "paid",
            items: [{ id: "5", tier: "Operating Agreement Template", price: 49.0, type: "template" }],
            createdAt: "2023-05-10T14:00:00Z",
            updatedAt: "2023-05-10T14:20:00Z",
            paymentDate: "2023-05-10T14:20:00Z",
          },
        ]

        setInvoices(fallbackInvoices)
      } finally {
        setLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [])

  const filteredPackageInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredTemplateInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.status.toLowerCase().includes(searchTerm.toLowerCase()) && invoice.invoiceNumber.includes("TEMP")),
  )

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Business Orders</h1>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="mb-4">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          {loadingInvoices ? (
            <div className="text-center py-10">Loading orders...</div>
          ) : filteredPackageInvoices.length === 0 ? (
            <div className="text-center py-10">No package orders found.</div>
          ) : (
            <div className="grid gap-4">
              {filteredPackageInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{invoice.invoiceNumber}</CardTitle>
                        <CardDescription>{invoice.customerName}</CardDescription>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p>{formatCurrency(invoice.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p>{formatDate(invoice.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Date</p>
                        <p>{formatDate(invoice.paymentDate) || "Not paid"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="truncate">{invoice.customerEmail}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/invoice/${invoice.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          {loadingInvoices ? (
            <div className="text-center py-10">Loading templates...</div>
          ) : filteredTemplateInvoices.length === 0 ? (
            <div className="text-center py-10">No template orders found.</div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplateInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{invoice.invoiceNumber}</CardTitle>
                        <CardDescription>{invoice.customerName}</CardDescription>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p>{formatCurrency(invoice.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p>{formatDate(invoice.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Date</p>
                        <p>{formatDate(invoice.paymentDate) || "Not paid"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="truncate">{invoice.customerEmail}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/invoice/${invoice.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

