"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  Users,
  MousePointer,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  RefreshCw,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/affiliate"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from "recharts"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AdminAffiliatePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [conversions, setConversions] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [pagination, setPagination] = useState({
    affiliates: { page: 1, total: 0, pages: 0 },
    conversions: { page: 1, total: 0, pages: 0 },
    payouts: { page: 1, total: 0, pages: 0 },
  })
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingSettings, setEditingSettings] = useState(false)
  const [updatedSettings, setUpdatedSettings] = useState<any>(null)
  const [selectedConversion, setSelectedConversion] = useState<any>(null)
  const [selectedPayout, setSelectedPayout] = useState<any>(null)
  const { toast } = useToast()

  // State for Overview Tab
  const [showMoreCount, setShowMoreCount] = useState(10)
  const [chartsLoading, setChartsLoading] = useState(true)

  // New states for enhanced features
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [clientFilter, setClientFilter] = useState<string>("")
  const [availableClients, setAvailableClients] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Function to fetch all data based on active tab
  const fetchData = useCallback(
    async (showLoadingState = true) => {
      if (showLoadingState) {
        setBackgroundLoading(true)
      } else {
        setLoading(true)
      }

      try {
        if (activeTab === "overview") {
          await Promise.all([fetchStats(), fetchDashboardData()])
        } else if (activeTab === "affiliates") {
          await fetchAffiliates()
        } else if (activeTab === "conversions") {
          await fetchConversions()
        } else if (activeTab === "payouts") {
          await fetchPayouts()
        } else if (activeTab === "settings") {
          await fetchSettings()
        }

        setLastRefreshed(new Date())
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to refresh data",
          variant: "destructive",
        })
      } finally {
        if (showLoadingState) {
          setBackgroundLoading(false)
        } else {
          setLoading(false)
        }
        setIsRefreshing(false)
      }
    },
    [
      activeTab,
      pagination.affiliates.page,
      pagination.conversions.page,
      pagination.payouts.page,
      statusFilter,
      clientFilter,
    ],
  )

  // Manual refresh function
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData(true)
  }

  useEffect(() => {
    fetchData(false)

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(
      () => {
        fetchData(true)
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [
    activeTab,
    pagination.affiliates.page,
    pagination.conversions.page,
    pagination.payouts.page,
    statusFilter,
    clientFilter,
    fetchData,
  ])

  // Fetch available clients for filtering
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/admin/affiliate/clients")
        if (res.ok) {
          const data = await res.json()
          setAvailableClients(data.clients)
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }

    fetchClients()
  }, [])

  const fetchStats = async () => {
    try {
      const clientParam = clientFilter ? `?clientId=${clientFilter}` : ""
      const res = await fetch(`/api/admin/affiliate/stats${clientParam}`)
      const data = await res.json()

      if (res.ok) {
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affiliate stats",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching affiliate stats:", error)
      throw error
    }
  }

  const fetchDashboardData = async () => {
    try {
      setChartsLoading(true)
      const clientParam = clientFilter ? `?clientId=${clientFilter}` : ""
      const res = await fetch(`/api/admin/affiliate/dashboard${clientParam}`)

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load chart data",
        variant: "destructive",
      })
      throw error
    } finally {
      setChartsLoading(false)
    }
  }

  const fetchAffiliates = async () => {
    try {
      const sortParam = sortConfig ? `&sort=${sortConfig.key}&order=${sortConfig.direction}` : ""
      const clientParam = clientFilter ? `&clientId=${clientFilter}` : ""
      const res = await fetch(
        `/api/admin/affiliate/affiliates?page=${pagination.affiliates.page}${sortParam}${clientParam}`,
      )
      const data = await res.json()

      if (res.ok) {
        setAffiliates(data.affiliates)
        setPagination((prev) => ({
          ...prev,
          affiliates: data.pagination,
        }))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affiliates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error)
      throw error
    }
  }

  const fetchConversions = async () => {
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : ""
      const sortParam = sortConfig ? `&sort=${sortConfig.key}&order=${sortConfig.direction}` : ""
      const clientParam = clientFilter ? `&clientId=${clientFilter}` : ""
      const res = await fetch(
        `/api/admin/affiliate/conversions?page=${pagination.conversions.page}${statusParam}${sortParam}${clientParam}`,
      )
      const data = await res.json()

      if (res.ok) {
        setConversions(data.conversions)
        setPagination((prev) => ({
          ...prev,
          conversions: data.pagination,
        }))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch conversions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching conversions:", error)
      throw error
    }
  }

  const fetchPayouts = async () => {
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : ""
      const sortParam = sortConfig ? `&sort=${sortConfig.key}&order=${sortConfig.direction}` : ""
      const clientParam = clientFilter ? `&clientId=${clientFilter}` : ""
      const res = await fetch(
        `/api/admin/affiliate/payouts?page=${pagination.payouts.page}${statusParam}${sortParam}${clientParam}`,
      )
      const data = await res.json()

      if (res.ok) {
        setPayouts(data.payouts)
        setPagination((prev) => ({
          ...prev,
          payouts: data.pagination,
        }))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch payouts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payouts:", error)
      throw error
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/affiliate/settings")
      const data = await res.json()

      if (res.ok) {
        setSettings(data.settings)
        setUpdatedSettings(data.settings)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      throw error
    }
  }

  // Sort function
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })

    // Reset pagination to first page when sorting
    setPagination((prev) => ({
      ...prev,
      [activeTab === "affiliates" ? "affiliates" : activeTab === "conversions" ? "conversions" : "payouts"]: {
        ...prev[activeTab === "affiliates" ? "affiliates" : activeTab === "conversions" ? "conversions" : "payouts"],
        page: 1,
      },
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("")
    setClientFilter("")
    setSortConfig(null)
    setSearchTerm("")

    // Reset pagination to first page
    setPagination((prev) => ({
      ...prev,
      [activeTab === "affiliates" ? "affiliates" : activeTab === "conversions" ? "conversions" : "payouts"]: {
        ...prev[activeTab === "affiliates" ? "affiliates" : activeTab === "conversions" ? "conversions" : "payouts"],
        page: 1,
      },
    }))
  }

  const updateConversionStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/conversions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Conversion status updated successfully",
        })
        setSelectedConversion(null)
        fetchData(true)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update conversion status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating conversion status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const updatePayoutStatus = async (id: string, status: string) => {
    try {
      // Get the notes from the textarea
      const notesElement = document.getElementById("payout-notes") as HTMLTextAreaElement
      const notes = notesElement ? notesElement.value : ""

      // Prepare the request body
      const requestBody: any = { status }

      // Only include adminNotes if there's a value
      if (notes) {
        requestBody.adminNotes = notes
      }

      const res = await fetch(`/api/admin/affiliate/payouts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Payout status updated successfully",
        })
        setSelectedPayout(null)
        fetchData(true)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update payout status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating payout status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const updateSettings = async () => {
    try {
      const res = await fetch("/api/admin/affiliate/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      })

      const data = await res.json()

      if (res.ok) {
        setSettings(data.settings)
        setEditingSettings(false)
        toast({
          title: "Success",
          description: "Affiliate settings updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const exportData = (type: string) => {
    let data: any[] = []
    let filename = ""

    if (type === "affiliates") {
      data = affiliates
      filename = "affiliates.csv"
    } else if (type === "conversions") {
      data = conversions
      filename = "conversions.csv"
    } else if (type === "payouts") {
      data = payouts
      filename = "payouts.csv"
    }

    if (data.length === 0) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      })
      return
    }

    // Convert data to CSV
    const headers = Object.keys(data[0]).filter((key) => !key.includes("_") && typeof data[0][key] !== "object")

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value instanceof Date) {
              return formatDate(value)
            }
            return typeof value === "string" ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render the loading overlay
  const renderLoadingOverlay = () => {
    if (!backgroundLoading) return null

    return (
      <div className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center space-x-4">
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-primary/10"></div>
            </div>
            <div>
              <h3 className="font-medium">Refreshing data</h3>
              <p className="text-sm text-muted-foreground">Please wait while we update your dashboard</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render the client filter
  const renderClientFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={clientFilter ? "bg-primary/10" : ""}>
            <Filter className="h-4 w-4 mr-2" />
            {clientFilter ? "Filtered by client" : "Filter by client"}
            {clientFilter && (
              <X
                className="h-4 w-4 ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setClientFilter("")
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b">
            <h4 className="font-medium">Filter by client</h4>
            <p className="text-sm text-muted-foreground">Select a client to view their data</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableClients
                .filter(
                  (client) =>
                    !searchTerm ||
                    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client.email.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => {
                      setClientFilter(client.id)
                      setSearchTerm("")
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span>{client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </Button>
                ))}
              {availableClients.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-2">No clients found</p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setClientFilter("")}>
                Clear filter
              </Button>
              <Button size="sm" onClick={() => document.body.click()}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Render the refresh button with last refreshed time
  const renderRefreshButton = () => {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Last updated: {lastRefreshed.toLocaleTimeString()}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || backgroundLoading}
          className={isRefreshing ? "animate-spin" : ""}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    )
  }

  // Render sortable table header
  const renderSortableHeader = (label: string, key: string) => {
    const isSorted = sortConfig?.key === key
    const direction = isSorted ? sortConfig.direction : undefined

    return (
      <TableHead className="cursor-pointer" onClick={() => requestSort(key)}>
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          <ArrowUpDown className={`h-4 w-4 ${isSorted ? "text-primary" : "text-muted-foreground"}`} />
          {isSorted && (
            <span className="sr-only">{direction === "asc" ? "sorted ascending" : "sorted descending"}</span>
          )}
        </div>
      </TableHead>
    )
  }

  const renderOverviewTab = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    // Filter pending payments
    const pendingPayments = stats?.recentConversions?.filter((c: any) => c.status === "PENDING") || []
    const visiblePendingPayments = pendingPayments.slice(0, showMoreCount)
    const hasMorePayments = pendingPayments.length > showMoreCount

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          {renderClientFilter()}
          {renderRefreshButton()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Total Affiliates</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{dashboardData?.stats?.totalAffiliates || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Total Clicks</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{dashboardData?.stats?.totalClicks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Conversion Rate</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{dashboardData?.stats?.conversionRate?.toFixed(1) || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <h3 className="font-medium">Total Commission</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(dashboardData?.stats?.totalCommission || 0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Conversions waiting for payment</CardDescription>
            </CardHeader>
            <CardContent>
              {visiblePendingPayments.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visiblePendingPayments.map((conversion: any) => (
                        <TableRow key={conversion.id}>
                          <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                          <TableCell>{conversion.link.user.name || conversion.link.user.email}</TableCell>
                          <TableCell>{formatCurrency(Number(conversion.amount))}</TableCell>
                          <TableCell>{formatCurrency(Number(conversion.commission))}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedConversion(conversion)}>
                                Review
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {hasMorePayments && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" onClick={() => setShowMoreCount((prev) => prev + 5)}>
                        Show More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">No pending payments</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>Payout requests waiting for processing</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.pendingPayouts > 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold mb-2">{stats.pendingPayouts}</p>
                  <p className="text-gray-500 mb-4">Pending payout requests</p>
                  <p className="text-xl font-bold mb-2">{formatCurrency(stats.pendingPayoutAmount)}</p>
                  <p className="text-gray-500 mb-4">Total amount to be paid</p>
                  <Button onClick={() => setActiveTab("payouts")}>View Pending Payouts</Button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No pending payouts</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Commission Charts Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Commission Overview</CardTitle>
            <CardDescription>Total and average commission per conversion</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                  <div className="absolute inset-3 rounded-full bg-primary/10"></div>
                </div>
              </div>
            ) : (
              <CommissionChart data={dashboardData?.monthlyStats || []} />
            )}
          </CardContent>
        </Card>

        {/* Clicks and Affiliates Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Clicks Over Time</CardTitle>
              <CardDescription>Number of affiliate link clicks</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                    <div className="absolute inset-3 rounded-full bg-primary/10"></div>
                  </div>
                </div>
              ) : (
                <ClicksChart data={dashboardData?.monthlyStats || []} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affiliate Growth</CardTitle>
              <CardDescription>Total number of affiliates over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                    <div className="absolute inset-3 rounded-full bg-primary/10"></div>
                  </div>
                </div>
              ) : (
                <AffiliatesChart data={dashboardData?.monthlyStats || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>Latest affiliate conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentConversions?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentConversions.map((conversion: any) => (
                    <TableRow key={conversion.id}>
                      <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                      <TableCell>{conversion.link.user.name || conversion.link.user.email}</TableCell>
                      <TableCell>{conversion.orderId}</TableCell>
                      <TableCell>{formatCurrency(Number(conversion.amount))}</TableCell>
                      <TableCell>{formatCurrency(Number(conversion.commission))}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            conversion.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : conversion.status === "PAID"
                                ? "bg-blue-100 text-blue-800"
                                : conversion.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {conversion.status.charAt(0) + conversion.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">No conversions yet</div>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  const renderAffiliatesTab = () => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Affiliates</CardTitle>
            <CardDescription>Manage your affiliate partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Affiliates</CardTitle>
            <CardDescription>Manage your affiliate partners</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => exportData("affiliates")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {renderRefreshButton()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search affiliates..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {renderClientFilter()}
            {(sortConfig || statusFilter || clientFilter || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderSortableHeader("Name", "name")}
                  {renderSortableHeader("Email", "email")}
                  {renderSortableHeader("Joined", "createdAt")}
                  {renderSortableHeader("Clicks", "clicks")}
                  {renderSortableHeader("Conversions", "conversions")}
                  {renderSortableHeader("Earnings", "earnings")}
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.length > 0 ? (
                  affiliates
                    .filter(
                      (affiliate) =>
                        !searchTerm ||
                        (affiliate.user.name && affiliate.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        affiliate.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>{affiliate.user.name || "N/A"}</TableCell>
                        <TableCell>{affiliate.user.email}</TableCell>
                        <TableCell>{formatDate(affiliate.createdAt)}</TableCell>
                        <TableCell>{affiliate._count.clicks}</TableCell>
                        <TableCell>{affiliate._count.conversions}</TableCell>
                        <TableCell>{formatCurrency(affiliate.earnings)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No affiliates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.affiliates.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.affiliates.page - 1) * 10 + 1} to{" "}
                {Math.min(pagination.affiliates.page * 10, pagination.affiliates.total)} of{" "}
                {pagination.affiliates.total} affiliates
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      affiliates: { ...prev.affiliates, page: prev.affiliates.page - 1 },
                    }))
                  }
                  disabled={pagination.affiliates.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      affiliates: { ...prev.affiliates, page: prev.affiliates.page + 1 },
                    }))
                  }
                  disabled={pagination.affiliates.page === pagination.affiliates.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderConversionsTab = () => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Conversions</CardTitle>
            <CardDescription>Manage affiliate conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Conversions</CardTitle>
            <CardDescription>Manage affiliate conversions</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => exportData("conversions")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {renderRefreshButton()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by order ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
            {renderClientFilter()}
            {(sortConfig || statusFilter || clientFilter || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderSortableHeader("Date", "createdAt")}
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Order ID</TableHead>
                  {renderSortableHeader("Amount", "amount")}
                  {renderSortableHeader("Commission", "commission")}
                  {renderSortableHeader("Status", "status")}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.length > 0 ? (
                  conversions
                    .filter(
                      (conversion) =>
                        !searchTerm || conversion.orderId.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                        <TableCell>{conversion.link.user.name || conversion.link.user.email}</TableCell>
                        <TableCell>{conversion.orderId}</TableCell>
                        <TableCell>{formatCurrency(Number(conversion.amount))}</TableCell>
                        <TableCell>{formatCurrency(Number(conversion.commission))}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              conversion.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : conversion.status === "PAID"
                                  ? "bg-blue-100 text-blue-800"
                                  : conversion.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }
                          >
                            {conversion.status.charAt(0) + conversion.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedConversion(conversion)}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      No conversions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.conversions.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.conversions.page - 1) * 10 + 1} to{" "}
                {Math.min(pagination.conversions.page * 10, pagination.conversions.total)} of{" "}
                {pagination.conversions.total} conversions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      conversions: { ...prev.conversions, page: prev.conversions.page - 1 },
                    }))
                  }
                  disabled={pagination.conversions.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      conversions: { ...prev.conversions, page: prev.conversions.page + 1 },
                    }))
                  }
                  disabled={pagination.conversions.page === pagination.conversions.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Conversion Review Dialog */}
          <Dialog open={!!selectedConversion} onOpenChange={(open) => !open && setSelectedConversion(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Conversion</DialogTitle>
                <DialogDescription>Review and update the status of this conversion</DialogDescription>
              </DialogHeader>

              {selectedConversion && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Affiliate</Label>
                      <p className="font-medium">
                        {selectedConversion.link.user.name || selectedConversion.link.user.email}
                      </p>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <p className="font-medium">{formatDate(selectedConversion.createdAt)}</p>
                    </div>
                    <div>
                      <Label>Order ID</Label>
                      <p className="font-medium">{selectedConversion.orderId}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="font-medium">{selectedConversion.status}</p>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="font-medium">{formatCurrency(Number(selectedConversion.amount))}</p>
                    </div>
                    <div>
                      <Label>Commission</Label>
                      <p className="font-medium">{formatCurrency(Number(selectedConversion.commission))}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Update Status</Label>
                    <Select
                      defaultValue={selectedConversion.status}
                      onValueChange={(value) => updateConversionStatus(selectedConversion.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedConversion(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  const renderPayoutsTab = () => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Manage affiliate payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Manage affiliate payouts</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => exportData("payouts")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {renderRefreshButton()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by affiliate..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {renderClientFilter()}
            {(sortConfig || statusFilter || clientFilter || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderSortableHeader("Date", "createdAt")}
                  <TableHead>Affiliate</TableHead>
                  {renderSortableHeader("Amount", "amount")}
                  <TableHead>Method</TableHead>
                  {renderSortableHeader("Status", "status")}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length > 0 ? (
                  payouts
                    .filter(
                      (payout) =>
                        !searchTerm ||
                        (payout.user.name && payout.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        payout.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{formatDate(payout.createdAt)}</TableCell>
                        <TableCell>{payout.user.name || payout.user.email}</TableCell>
                        <TableCell>{formatCurrency(Number(payout.amount))}</TableCell>
                        <TableCell>{payout.method}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              payout.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : payout.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : payout.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                            }
                          >
                            {payout.status === "IN_PROGRESS"
                              ? "In Progress"
                              : payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayout(payout)}
                            disabled={payout.status === "REJECTED"}
                          >
                            {payout.status === "REJECTED" ? "Rejected" : "Review"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No payouts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.payouts.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.payouts.page - 1) * 10 + 1} to{" "}
                {Math.min(pagination.payouts.page * 10, pagination.payouts.total)} of {pagination.payouts.total} payouts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      payouts: { ...prev.payouts, page: prev.payouts.page - 1 },
                    }))
                  }
                  disabled={pagination.payouts.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      payouts: { ...prev.payouts, page: prev.payouts.page + 1 },
                    }))
                  }
                  disabled={pagination.payouts.page === pagination.payouts.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Payout Review Dialog */}
          <Dialog open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Payout</DialogTitle>
                <DialogDescription>Review and update the status of this payout request</DialogDescription>
              </DialogHeader>

              {selectedPayout && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Affiliate</Label>
                      <p className="font-medium">{selectedPayout.user.name || selectedPayout.user.email}</p>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <p className="font-medium">{formatDate(selectedPayout.createdAt)}</p>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="font-medium">{formatCurrency(Number(selectedPayout.amount))}</p>
                    </div>
                    <div>
                      <Label>Method</Label>
                      <p className="font-medium">{selectedPayout.method}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="font-medium">{selectedPayout.status}</p>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Payment Details</h3>
                    {selectedPayout.notes && (
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const paymentDetails = JSON.parse(selectedPayout.notes)
                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-500">Payment Method</Label>
                                    <p className="font-medium">
                                      {paymentDetails.method === "bank"
                                        ? "Bank Transfer"
                                        : paymentDetails.method === "paypal"
                                          ? "PayPal"
                                          : paymentDetails.method === "mobile"
                                            ? "Mobile Payment"
                                            : paymentDetails.method}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Full Name</Label>
                                    <p className="font-medium">
                                      {paymentDetails.fullName || paymentDetails.accountName}
                                    </p>
                                  </div>

                                  {paymentDetails.method === "bank" && (
                                    <>
                                      <div>
                                        <Label className="text-xs text-gray-500">Bank Name</Label>
                                        <p className="font-medium">{paymentDetails.bankName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Account Number</Label>
                                        <p className="font-medium">{paymentDetails.accountNumber}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">IBAN</Label>
                                        <p className="font-medium">{paymentDetails.iban || "Not provided"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">SWIFT/BIC Code</Label>
                                        <p className="font-medium">{paymentDetails.swiftCode || "Not provided"}</p>
                                      </div>
                                      {paymentDetails.branchAddress && (
                                        <div className="col-span-1 sm:col-span-2">
                                          <Label className="text-xs text-gray-500">Branch Address</Label>
                                          <p className="font-medium">{paymentDetails.branchAddress}</p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {paymentDetails.method === "paypal" && (
                                    <div>
                                      <Label className="text-xs text-gray-500">PayPal Email</Label>
                                      <p className="font-medium">{paymentDetails.email}</p>
                                    </div>
                                  )}

                                  {paymentDetails.method === "mobile" && (
                                    <>
                                      <div>
                                        <Label className="text-xs text-gray-500">Mobile Number</Label>
                                        <p className="font-medium">{paymentDetails.mobileNumber}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Service Provider</Label>
                                        <p className="font-medium">{paymentDetails.serviceProvider}</p>
                                      </div>
                                      {paymentDetails.cnic && (
                                        <div>
                                          <Label className="text-xs text-gray-500">CNIC</Label>
                                          <p className="font-medium">{paymentDetails.cnic}</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </>
                            )
                          } catch (e) {
                            return <p className="text-sm">{selectedPayout.notes}</p>
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  {selectedPayout.status === "REJECTED" && selectedPayout.adminNotes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Label className="text-xs text-amber-800">Admin Notes</Label>
                      <p className="text-sm text-amber-900">{selectedPayout.adminNotes}</p>
                    </div>
                  )}

                  {selectedPayout.status !== "REJECTED" && (
                    <>
                      <div>
                        <Label>Admin Notes</Label>
                        <Textarea
                          placeholder="Add notes about this payout"
                          defaultValue={selectedPayout.adminNotes || ""}
                          id="payout-notes"
                        />
                      </div>

                      <div>
                        <Label>Update Status</Label>
                        <Select
                          defaultValue={selectedPayout.status}
                          onValueChange={(value) => updatePayoutStatus(selectedPayout.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                  {selectedPayout?.status === "REJECTED" ? "Close" : "Cancel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  const renderSettingsTab = () => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Program Settings</CardTitle>
            <CardDescription>Configure your affiliate program settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Affiliate Program Settings</CardTitle>
            <CardDescription>Configure your affiliate program settings</CardDescription>
          </div>
          {!editingSettings ? (
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" size="sm" onClick={() => setEditingSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Settings
              </Button>
              {renderRefreshButton()}
            </div>
          ) : (
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSettings(false)
                  setUpdatedSettings(settings)
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={updateSettings}>
                Save Changes
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="commission-rate">Commission Rate (%)</Label>
              {editingSettings ? (
                <Input
                  id="commission-rate"
                  type="number"
                  min="1"
                  max="100"
                  value={updatedSettings?.commissionRate}
                  onChange={(e) =>
                    setUpdatedSettings({
                      ...updatedSettings,
                      commissionRate: Number.parseFloat(e.target.value),
                    })
                  }
                />
              ) : (
                <p className="text-lg font-medium">{settings?.commissionRate}%</p>
              )}
              <p className="text-sm text-gray-500">
                The percentage of the purchase amount that affiliates earn as commission
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="min-payout">Minimum Payout Amount ($)</Label>
              {editingSettings ? (
                <Input
                  id="min-payout"
                  type="number"
                  min="1"
                  value={updatedSettings?.minPayoutAmount}
                  onChange={(e) =>
                    setUpdatedSettings({
                      ...updatedSettings,
                      minPayoutAmount: Number.parseFloat(e.target.value),
                    })
                  }
                />
              ) : (
                <p className="text-lg font-medium">${settings?.minPayoutAmount}</p>
              )}
              <p className="text-sm text-gray-500">
                The minimum amount an affiliate must earn before they can request a payout
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cookie-duration">Cookie Duration (Days)</Label>
              {editingSettings ? (
                <Input
                  id="cookie-duration"
                  type="number"
                  min="1"
                  value={updatedSettings?.cookieDuration}
                  onChange={(e) =>
                    setUpdatedSettings({
                      ...updatedSettings,
                      cookieDuration: Number.parseInt(e.target.value),
                    })
                  }
                />
              ) : (
                <p className="text-lg font-medium">{settings?.cookieDuration} days</p>
              )}
              <p className="text-sm text-gray-500">
                How long the affiliate cookie lasts after a user clicks an affiliate link
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Affiliate Program Management</h1>

      {renderLoadingOverlay()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <TabsList className="mb-4 sm:mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>

        <TabsContent value="affiliates">{renderAffiliatesTab()}</TabsContent>

        <TabsContent value="conversions">{renderConversionsTab()}</TabsContent>

        <TabsContent value="payouts">{renderPayoutsTab()}</TabsContent>

        <TabsContent value="settings">{renderSettingsTab()}</TabsContent>
      </Tabs>
    </div>
  )
}

// Chart Components
const CommissionChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorAvgCommission" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              return [`$${value.toFixed(2)}`, name === "commission" ? "Total Commission" : "Avg Commission"]
            }}
            contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="commission"
            name="Total Commission"
            stroke="#4f46e5"
            fillOpacity={1}
            fill="url(#colorCommission)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          <Area
            type="monotone"
            dataKey="avgCommission"
            name="Avg Commission"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorAvgCommission)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const ClicksChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [value.toString(), "Clicks"]}
            contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          <Bar
            dataKey="clicks"
            fill="url(#colorClicks)"
            name="Clicks"
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const AffiliatesChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorAffiliates" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              return [value.toString(), name === "totalAffiliates" ? "Total Affiliates" : "New Affiliates"]
            }}
            contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalAffiliates"
            stroke="#f59e0b"
            name="Total Affiliates"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f59e0b" }}
            activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff" }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="newAffiliates"
            stroke="#60a5fa"
            name="New Affiliates"
            strokeWidth={2}
            dot={{ r: 4, fill: "#60a5fa" }}
            activeDot={{ r: 6, fill: "#60a5fa", stroke: "#fff" }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

