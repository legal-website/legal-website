"use client"

import { useState, useEffect } from "react"
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

export default function AdminAffiliatePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
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

  useEffect(() => {
    if (activeTab === "overview") {
      fetchStats()
    } else if (activeTab === "affiliates") {
      fetchAffiliates()
    } else if (activeTab === "conversions") {
      fetchConversions()
    } else if (activeTab === "payouts") {
      fetchPayouts()
    } else if (activeTab === "settings") {
      fetchSettings()
    }
  }, [activeTab, pagination.affiliates.page, pagination.conversions.page, pagination.payouts.page, statusFilter])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/affiliate/stats")
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
      setLoading(false)
    } catch (error) {
      console.error("Error fetching affiliate stats:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/affiliate/affiliates?page=${pagination.affiliates.page}`)
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
      setLoading(false)
    } catch (error) {
      console.error("Error fetching affiliates:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchConversions = async () => {
    try {
      setLoading(true)
      const statusParam = statusFilter ? `&status=${statusFilter}` : ""
      const res = await fetch(`/api/admin/affiliate/conversions?page=${pagination.conversions.page}${statusParam}`)
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
      setLoading(false)
    } catch (error) {
      console.error("Error fetching conversions:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const statusParam = statusFilter ? `&status=${statusFilter}` : ""
      const res = await fetch(`/api/admin/affiliate/payouts?page=${pagination.payouts.page}${statusParam}`)
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
      setLoading(false)
    } catch (error) {
      console.error("Error fetching payouts:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setLoading(false)
    }
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
        fetchConversions()
        fetchStats()
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

  const updatePayoutStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/payouts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Payout status updated successfully",
        })
        setSelectedPayout(null)
        fetchPayouts()
        fetchStats()
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

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Total Affiliates</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalAffiliates || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Total Clicks</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalClicks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Conversion Rate</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.conversionRate?.toFixed(1) || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <h3 className="font-medium">Total Commission</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats?.totalCommission || 0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Conversions waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentConversions?.filter((c: any) => c.status === "PENDING").length > 0 ? (
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
                    {stats.recentConversions
                      .filter((c: any) => c.status === "PENDING")
                      .map((conversion: any) => (
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
              ) : (
                <div className="text-center py-4 text-gray-500">No pending conversions</div>
              )}
            </CardContent>
          </Card>

          <Card>
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
          <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={() => exportData("affiliates")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search affiliates..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Earnings</TableHead>
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
          <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={() => exportData("conversions")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
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
          <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={() => exportData("payouts")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
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
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
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
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedPayout(payout)}>
                            Review
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
            <DialogContent>
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

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Add notes about this payout"
                      defaultValue={selectedPayout.notes || ""}
                      id="payout-notes"
                    />
                  </div>

                  <div>
                    <Label>Update Status</Label>
                    <Select
                      defaultValue={selectedPayout.status}
                      onValueChange={(value) => {
                        const notes = (document.getElementById("payout-notes") as HTMLTextAreaElement)?.value
                        updatePayoutStatus(selectedPayout.id, value, notes)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                  Cancel
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
            <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={() => setEditingSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Settings
            </Button>
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

