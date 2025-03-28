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
}

interface Comment {
  id: string
  content: string
  postTitle: string
  author: string
  createdAt: string
  status: string
}

interface Amendment {
  id: string
  title: string
  status: string
  amount: number
  createdAt: string
  businessName: string
}

interface AnnualReport {
  id: string
  title: string
  status: string
  createdAt: string
  businessName: string
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
      try {
        // Fetch invoices
        fetch("/api/admin/invoices")
          .then((res) => res.json())
          .then((data) => {
            setInvoices(data.invoices || [])
            setLoading((prev) => ({ ...prev, invoices: false }))
          })
          .catch((err) => {
            console.error("Error fetching invoices:", err)
            setLoading((prev) => ({ ...prev, invoices: false }))
          })

        // Fetch users
        fetch("/api/admin/users")
          .then((res) => res.json())
          .then((data) => {
            setUsers(data.users || [])
            setLoading((prev) => ({ ...prev, users: false }))
          })
          .catch((err) => {
            console.error("Error fetching users:", err)
            setLoading((prev) => ({ ...prev, users: false }))
          })

        // Fetch templates
        fetch("/api/admin/templates")
          .then((res) => res.json())
          .then((data) => {
            setTemplates(data.templates || [])
            setLoading((prev) => ({ ...prev, templates: false }))
          })
          .catch((err) => {
            console.error("Error fetching templates:", err)
            setLoading((prev) => ({ ...prev, templates: false }))
          })

        // Fetch tickets
        fetch("/api/admin/tickets")
          .then((res) => res.json())
          .then((data) => {
            setTickets(data.tickets || [])
            setLoading((prev) => ({ ...prev, tickets: false }))
          })
          .catch((err) => {
            console.error("Error fetching tickets:", err)
            setLoading((prev) => ({ ...prev, tickets: false }))
          })

        // Fetch comments
        fetch("/api/community/comments")
          .then((res) => res.json())
          .then((data) => {
            setComments(data.comments || [])
            setLoading((prev) => ({ ...prev, comments: false }))
          })
          .catch((err) => {
            console.error("Error fetching comments:", err)
            setLoading((prev) => ({ ...prev, comments: false }))
          })

        // Fetch amendments
        fetch("/api/user/amendments")
          .then((res) => res.json())
          .then((data) => {
            setAmendments(data.amendments || [])
            setLoading((prev) => ({ ...prev, amendments: false }))
          })
          .catch((err) => {
            console.error("Error fetching amendments:", err)
            setLoading((prev) => ({ ...prev, amendments: false }))
          })

        // Fetch annual reports
        fetch("/api/user/annual-reports/filings")
          .then((res) => res.json())
          .then((data) => {
            setAnnualReports(data.filings || [])
            setLoading((prev) => ({ ...prev, annualReports: false }))
          })
          .catch((err) => {
            console.error("Error fetching annual reports:", err)
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
    const monthlyData: Record<string, number> = {}

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0
      }

      monthlyData[monthYear] += invoice.amount || 0
    })

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
      avgPerInvoice: invoices.length ? Math.round(amount / invoices.length) : 0,
    }))
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

    return [
      { name: "Template Invoices", value: templateRevenue },
      { name: "Regular Invoices", value: regularRevenue },
    ]
  }

  // Calculate amendment revenue for bar chart
  const getAmendmentRevenueData = () => {
    const approvedAmendments = amendments.filter((a) => a.status === "approved")
    const pendingAmendments = amendments.filter((a) => a.status === "pending")

    const approvedTotal = approvedAmendments.reduce((sum, a) => sum + (a.amount || 0), 0)
    const pendingTotal = pendingAmendments.reduce((sum, a) => sum + (a.amount || 0), 0)

    return [
      { name: "Approved", amount: approvedTotal },
      { name: "Pending", amount: pendingTotal },
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
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              {loading.users ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{users.length}</div>
              )}
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 8) + 2} new users this week</p>
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
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>

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
              ) : (
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
                              : ticket.status === "in_progress"
                                ? "outline"
                                : ticket.status === "resolved"
                                  ? "secondary"
                                  : "secondary"
                          }
                          className={`${
                            ticket.status === "resolved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ticket.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</div>
                      </div>
                    </div>
                  ))}
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
              ) : (
                <div className="space-y-4">
                  {comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{comment.postTitle}</p>
                          <p className="text-sm text-muted-foreground">By {comment.author}</p>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fifth Section - Recent Amendments */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Amendments</CardTitle>
                <CardDescription>Latest amendment requests</CardDescription>
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
              ) : (
                <div className="space-y-4">
                  {amendments.slice(0, 3).map((amendment) => (
                    <div key={amendment.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-2">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{amendment.title}</p>
                          <p className="text-sm text-muted-foreground">{amendment.businessName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            amendment.status === "approved"
                              ? "secondary"
                              : amendment.status === "pending"
                                ? "outline"
                                : amendment.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                          }
                          className={`${
                            amendment.status === "approved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : amendment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }`}
                        >
                          {amendment.status}
                        </Badge>
                        <div className="font-medium">{formatCurrency(amendment.amount)}</div>
                      </div>
                    </div>
                  ))}
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
              ) : (
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

