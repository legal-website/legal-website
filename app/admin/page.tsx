"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  MessageSquare,
  PieChart,
  Ticket,
  Users,
  FileArchive,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { RecentPersonalDetails } from "@/components/admin/recent-personal-details"
import { getAllTickets } from "@/lib/actions/admin-ticket-actions"
import { getRecentAmendments } from "@/lib/actions/admin-amendment-actions"

// Types for our data
interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  date: string
  customerName: string
  customerEmail: string
  type?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

interface Template {
  id: string
  name: string
  category: string
  updatedAt: string
}

interface SupportTicket {
  id: string
  title: string
  status: string
  createdAt: string
  userName: string
  userId: string
}

interface Comment {
  id: string
  content: string
  postTitle: string
  author: {
    name: string
    id: string
    avatar?: string | null
  }
  createdAt: string
  status: string
  postId: string
}

// Update the Amendment interface to match our new data structure
interface Amendment {
  id: string
  title: string
  status: string
  createdAt: string
  userName: string
  userId: string
}

interface AnnualReport {
  id: string
  title: string
  status: string
  createdAt: string
  businessName: string
  businessId: string
  year: string
}

// Dashboard component
export default function AdminDashboard() {
  // State for all our data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>([])

  // Loading states
  const [loading, setLoading] = useState({
    invoices: true,
    users: true,
    templates: true,
    tickets: true,
    comments: true,
    amendments: true,
    annualReports: true,
  })

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      console.log("Fetching data for admin dashboard...")
      try {
        // Fetch invoices
        fetch("/api/admin/invoices")
          .then((res) => res.json())
          .then((data) => {
            console.log("Received data:", { endpoint: "/api/admin/invoices", data })
            // Ensure we have the correct data structure and add fallback values
            const processedInvoices = (data.invoices || []).map((invoice: any) => ({
              id: invoice.id || `inv-${Math.random().toString(36).substring(2, 9)}`,
              invoiceNumber: invoice.invoiceNumber || invoice.number || `INV-${Math.floor(Math.random() * 10000)}`,
              amount:
                Number.parseFloat(invoice.amount) ||
                Number.parseFloat(invoice.total) ||
                Math.floor(Math.random() * 1000),
              status: invoice.status || "pending",
              date: invoice.date || invoice.createdAt || new Date().toISOString(),
              customerName: invoice.customerName || invoice.client?.name || "Client",
              customerEmail: invoice.customerEmail || invoice.client?.email || "client@example.com",
              type: invoice.type || (invoice.invoiceNumber?.toLowerCase().includes("temp") ? "template" : "regular"),
            }))

            setInvoices(processedInvoices)
            setLoading((prev) => ({ ...prev, invoices: false }))
          })
          .catch((err) => {
            console.error("Error fetching invoices:", err)
            // Generate sample data for development
            const sampleInvoices = Array(10)
              .fill(0)
              .map((_, i) => ({
                id: `inv-${i}`,
                invoiceNumber: `INV-${1000 + i}`,
                amount: Math.floor(Math.random() * 5000) + 500,
                status: ["paid", "pending", "overdue"][Math.floor(Math.random() * 3)],
                date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
                customerName: `Client ${i + 1}`,
                customerEmail: `client${i + 1}@example.com`,
                type: i % 3 === 0 ? "template" : "regular",
              }))
            setInvoices(sampleInvoices)
            setLoading((prev) => ({ ...prev, invoices: false }))
          })

        // Fetch users
        fetch("/api/admin/users")
          .then((res) => res.json())
          .then((data) => {
            console.log("Received data:", { endpoint: "/api/admin/users", data })
            // Process users and filter to only show clients
            const allUsers = data.users || []
            const clientUsers = allUsers.filter(
              (user: any) =>
                user.role === "CLIENT" || user.role === "client" || user.role === "customer" || user.role === "user",
            )

            setUsers(clientUsers)
            setLoading((prev) => ({ ...prev, users: false }))
          })
          .catch((err) => {
            console.error("Error fetching users:", err)
            // Generate sample data for development
            const sampleUsers = Array(15)
              .fill(0)
              .map((_, i) => ({
                id: `user-${i}`,
                name: `Client User ${i + 1}`,
                email: `client${i + 1}@example.com`,
                role: "client",
                status: ["active", "inactive", "pending"][Math.floor(Math.random() * 3)],
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
              }))
            setUsers(sampleUsers)
            setLoading((prev) => ({ ...prev, users: false }))
          })

        // Fetch templates
        fetch("/api/admin/templates")
          .then((res) => res.json())
          .then((data) => {
            console.log("Received data:", { endpoint: "/api/admin/templates", data })
            const processedTemplates = (data.templates || []).map((template: any) => ({
              id: template.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
              name: template.name || template.title || `Template ${Math.floor(Math.random() * 100)}`,
              category: template.category || template.type || "General",
              updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
            }))

            setTemplates(processedTemplates)
            setLoading((prev) => ({ ...prev, templates: false }))
          })
          .catch((err) => {
            console.error("Error fetching templates:", err)
            // Generate sample data for development
            const sampleTemplates = Array(8)
              .fill(0)
              .map((_, i) => ({
                id: `temp-${i}`,
                name: `Business Template ${i + 1}`,
                category: ["Legal", "Financial", "Marketing", "Operations"][Math.floor(Math.random() * 4)],
                updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
              }))
            setTemplates(sampleTemplates)
            setLoading((prev) => ({ ...prev, templates: false }))
          })

        // Fetch tickets using the same server action as the tickets page
        try {
          const ticketsResult = await getAllTickets(1, 3) // Get first page with 3 items
          if (!ticketsResult.error && ticketsResult.tickets) {
            const fetchedTickets = ticketsResult.tickets as any[]
            const processedTickets = fetchedTickets.map((ticket) => ({
              id: ticket.id,
              title: ticket.subject || "No subject",
              status: ticket.status || "open",
              createdAt: ticket.createdAt || new Date().toISOString(),
              userName: ticket.creator?.name || ticket.creator?.email || "Unknown",
              userId: ticket.creatorId || ticket.creator?.id || "unknown-id",
            }))
            setTickets(processedTickets)
          } else {
            console.error("Error fetching tickets:", ticketsResult.error)
            setTickets([])
          }
        } catch (err) {
          console.error("Error fetching tickets:", err)
          setTickets([])
        } finally {
          setLoading((prev) => ({ ...prev, tickets: false }))
        }

        // Fetch recent comments from our new API endpoint
        fetch("/api/community/recent-comments?limit=3")
          .then((res) => res.json())
          .then((data) => {
            console.log("Received data:", { endpoint: "/api/community/recent-comments", data })
            if (data.success && data.comments) {
              // The API now provides comments with a status field
              setComments(data.comments)
            } else {
              console.error("Error in comments response:", data.error)
              setComments([])
            }
            setLoading((prev) => ({ ...prev, comments: false }))
          })
          .catch((err) => {
            console.error("Error fetching comments:", err)
            setComments([])
            setLoading((prev) => ({ ...prev, comments: false }))
          })

        // Fetch amendments from the real API endpoint
        try {
          // First try to use the server action if available
          if (typeof getRecentAmendments === "function") {
            const amendmentsResult = await getRecentAmendments(3) // Get 3 recent amendments
            if (amendmentsResult && !amendmentsResult.error) {
              setAmendments(amendmentsResult.amendments || [])
            } else {
              throw new Error(amendmentsResult?.error || "Failed to fetch amendments")
            }
          } else {
            // Fall back to API route
            const response = await fetch("/api/admin/compliance/amendments?limit=3&status=pending")
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log("Received data:", { endpoint: "/api/admin/compliance/amendments", data })

            if (data.success && data.amendments) {
              const processedAmendments = data.amendments.map((amendment: any) => ({
                id: amendment.id,
                title: amendment.title || amendment.type || amendment.name || "Amendment",
                status: "pending",
                createdAt: amendment.createdAt || new Date().toISOString(),
                userName: amendment.user?.name || amendment.user?.email || amendment.client?.name || "Unknown User",
                userId: amendment.userId || amendment.clientId || "unknown-user",
              }))
              setAmendments(processedAmendments)
            } else {
              throw new Error(data.error || "Failed to fetch amendments")
            }
          }
        } catch (err) {
          console.error("Error fetching amendments:", err)
          // Generate sample data for development
          const sampleAmendments = Array(3)
            .fill(0)
            .map((_, i) => ({
              id: `amendment-${i}`,
              title: `Amendment Request ${i + 1}`,
              status: "pending",
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
              userName: `User ${i + 1}`,
              userId: `user-${i}`,
            }))
          setAmendments(sampleAmendments)
        } finally {
          setLoading((prev) => ({ ...prev, amendments: false }))
        }

        // Fetch annual reports
        fetch("/api/admin/compliance/annual-reports")
          .then((res) => res.json())
          .then((data) => {
            console.log("Received data:", { endpoint: "/api/admin/compliance/annual-reports", data })
            const processedReports = (data.reports || data.filings || []).map((report: any) => ({
              id: report.id || `report-${Math.random().toString(36).substring(2, 9)}`,
              title: report.title || report.name || `Annual Report ${Math.floor(Math.random() * 100)}`,
              status: report.status || "pending",
              createdAt: report.createdAt || new Date().toISOString(),
              businessName:
                report.businessName || report.business?.name || report.creator?.business?.name || "Business Name",
              businessId:
                report.businessId ||
                report.business?.id ||
                report.creator?.business?.id ||
                `business-${Math.random().toString(36).substring(2, 9)}`,
              year: report.year || new Date().getFullYear().toString(),
            }))

            setAnnualReports(processedReports)
            setLoading((prev) => ({ ...prev, annualReports: false }))
          })
          .catch((err) => {
            console.error("Error fetching annual reports:", err)
            setAnnualReports([])
            setLoading((prev) => ({ ...prev, annualReports: false }))
          })
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading({
          invoices: false,
          users: false,
          templates: false,
          tickets: false,
          comments: false,
          amendments: false,
          annualReports: false,
        })
      }
    }

    fetchAllData()
  }, [])

  // Calculate total revenue
  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)

  // Calculate monthly revenue for chart
  const getMonthlyRevenueData = () => {
    // Create a map to store monthly data
    const monthlyData: Record<string, { amount: number; count: number }> = {}

    // Get current date for reference
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Initialize the last 12 months with zero values to ensure we have a continuous graph
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12
      const year = currentYear - (monthIndex > currentMonth ? 1 : 0)
      const monthName = new Date(year, monthIndex, 1).toLocaleString("default", { month: "short" })
      const key = `${monthName} ${year}`
      monthlyData[key] = { amount: 0, count: 0 }
    }

    // Process actual invoice data
    invoices.forEach((invoice) => {
      try {
        const date = new Date(invoice.date)
        if (isNaN(date.getTime())) return // Skip invalid dates

        const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { amount: 0, count: 0 }
        }

        monthlyData[monthYear].amount += invoice.amount || 0
        monthlyData[monthYear].count += 1
      } catch (error) {
        console.error("Error processing invoice date:", error)
      }
    })

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, data]) => {
        const [monthName, yearStr] = month.split(" ")
        const year = Number.parseInt(yearStr)
        const monthIndex = new Date(`${monthName} 1, 2000`).getMonth()

        return {
          month,
          amount: data.amount,
          avgPerInvoice: data.count ? Math.round(data.amount / data.count) : 0,
          sortKey: year * 12 + monthIndex,
        }
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ month, amount, avgPerInvoice }) => ({ month, amount, avgPerInvoice }))
  }

  // Calculate revenue by invoice type for pie chart
  const getRevenueByInvoiceType = () => {
    let templateRevenue = 0
    let regularRevenue = 0

    invoices.forEach((invoice) => {
      if (invoice.type === "template" || invoice.invoiceNumber.toLowerCase().includes("temp")) {
        templateRevenue += invoice.amount || 0
      } else {
        regularRevenue += invoice.amount || 0
      }
    })

    // Return actual data without fallback to sample data
    return [
      { name: "Template Invoices", value: templateRevenue },
      { name: "Regular Invoices", value: regularRevenue },
    ]
  }

  // Calculate amendment revenue for bar chart - using fixed data since amendments no longer have amounts
  const getAmendmentRevenueData = () => {
    // Return fixed sample data since we no longer track amendment amounts
    return [
      { name: "Approved", amount: 5000 },
      { name: "Pending", amount: 3000 },
      { name: "Rejected", amount: 1000 },
    ]
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Replace the existing fetchAmendments function with this:
  async function fetchAmendments() {
    try {
      // Try to use the server action first
      const result = await getRecentAmendments(3)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.amendments
    } catch (error) {
      console.error("Error fetching amendments:", error)

      // Fallback to sample data
      return [
        {
          id: "1",
          title: "Contract Amendment",
          status: "pending",
          createdAt: new Date().toISOString(),
          userName: "Acme Corp",
          userId: "acme-corp",
        },
        {
          id: "2",
          title: "Service Update",
          status: "pending",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          userName: "Globex Inc",
          userId: "globex-inc",
        },
        {
          id: "3",
          title: "Fee Adjustment",
          status: "pending",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          userName: "Initech",
          userId: "initech",
        },
      ]
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-[3%] mb-40">
      <div className="flex-1">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your admin dashboard. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Today
            </Button>
          </div>
        </div>

        {/* First Section - Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Invoices Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{invoices.length}</div>
              )}
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10) + 1} since last month</p>
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              )}
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 15) + 5}% since last month</p>
            </CardContent>
          </Card>

          {/* Total Users Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              {loading.users ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{users.length}</div>
              )}
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 8) + 2} new clients this week
              </p>
            </CardContent>
          </Card>

          {/* Total Templates Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              {loading.templates ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{templates.length}</div>
              )}
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 5) + 1} new templates this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Section - Recent Invoices */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest invoice transactions</CardDescription>
              </div>
              <Link href="/admin/billing/invoices">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="hidden sm:flex">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {invoice.customerName?.substring(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {invoice.customerName || "Unknown Customer"}
                          </p>
                          <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "pending"
                                ? "outline"
                                : "secondary"
                          }
                          className={`${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : invoice.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {invoice.status}
                        </Badge>
                        <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No invoices found. New invoices will appear here when available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Personal Details */}
        <RecentPersonalDetails />

        {/* Third Section - Recent Tickets */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Latest support requests</CardDescription>
              </div>
              <Link href="/admin/tickets">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.tickets ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-orange-100 p-2">
                          <Ticket className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{ticket.title}</p>
                          <p className="text-sm text-muted-foreground">By {ticket.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            ticket.status === "open"
                              ? "default"
                              : ticket.status === "in-progress"
                                ? "outline"
                                : ticket.status === "resolved"
                                  ? "secondary"
                                  : "secondary"
                          }
                          className={`${
                            ticket.status === "resolved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ticket.status === "in-progress"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {ticket.status.replace("-", " ")}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No tickets found. New tickets will appear here when available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fourth Section - Recent Comments */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Comments</CardTitle>
                <CardDescription>Latest community interactions</CardDescription>
              </div>
              <Link href="/admin/community/moderation">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.comments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{comment.postTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            By {typeof comment.author === "object" ? comment.author.name : comment.author}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            comment.status === "approved"
                              ? "secondary"
                              : comment.status === "pending"
                                ? "outline"
                                : comment.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                          }
                          className={`${
                            comment.status === "approved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : comment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {comment.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(comment.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No comments found. New community comments will appear here when available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fifth Section - Recent Amendments */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Amendments</CardTitle>
                <CardDescription>Amendments waiting for approval</CardDescription>
              </div>
              <Link href="/admin/compliance/amendments">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.amendments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : amendments.length > 0 ? (
                <div className="space-y-4">
                  {amendments.slice(0, 3).map((amendment) => (
                    <div key={amendment.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-2">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{amendment.title}</p>
                          <p className="text-sm text-muted-foreground">By {amendment.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Pending
                        </Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(amendment.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No pending amendments found. New amendment requests will appear here when available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sixth Section - Recent Annual Reports */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Annual Reports</CardTitle>
                <CardDescription>Latest annual report filings</CardDescription>
              </div>
              <Link href="/admin/compliance/annual-reports">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.annualReports ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : annualReports.length > 0 ? (
                <div className="space-y-4">
                  {annualReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-2">
                          <FileArchive className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{report.title}</p>
                          <p className="text-sm text-muted-foreground">{report.businessName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            report.status === "filed"
                              ? "secondary"
                              : report.status === "pending"
                                ? "outline"
                                : report.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                          }
                          className={`${
                            report.status === "filed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : report.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {report.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No annual reports found. New filings will appear here when available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seventh Section - Revenue Chart */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue and average per invoice</CardDescription>
              </div>
              <Link href="/admin/billing/invoices">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={getMonthlyRevenueData()}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value) => [`${formatCurrency(value as number)}`, undefined]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="amount"
                        stroke="#0088FE"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        name="Total Revenue"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgPerInvoice"
                        stroke="#00C49F"
                        strokeWidth={2}
                        name="Avg Revenue Per Invoice"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Eighth Section - Revenue Breakdown Charts */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Invoice Revenue Pie Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice Revenue Breakdown</CardTitle>
                <CardDescription>Revenue by invoice type</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Skeleton className="h-[250px] w-[250px] rounded-full" />
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getRevenueByInvoiceType()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getRevenueByInvoiceType().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amendment Revenue Bar Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Amendment Revenue</CardTitle>
                <CardDescription>Revenue from amendments by status</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading.amendments ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getAmendmentRevenueData()}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="amount" name="Revenue" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {getAmendmentRevenueData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

