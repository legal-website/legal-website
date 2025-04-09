"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { useRouter } from "next/navigation"

// Types
interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface SummaryMetrics {
  users: number
  newUsers: number
  sessions: number
  pageviews: number
  avgSessionDuration: number
  bounceRate: number
}

interface PageViewData {
  date: string
  value: number
}

interface TopPage {
  page: string
  pageviews: number
  avgTimeOnPage: number
}

interface DemographicData {
  country: string
  users: number
}

interface TrafficSource {
  source: string
  sessions: number
}

interface DeviceData {
  device: string
  sessions: number
}

interface EnvironmentVariable {
  name: string
  value: string
  status: "present" | "missing"
  details?: string
}

interface ConnectionStatus {
  success: boolean
  message: string
  dataAvailable: boolean
}

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
]

// Mock data for when API fails
const mockSummaryMetrics: SummaryMetrics = {
  users: 1250,
  newUsers: 487,
  sessions: 1893,
  pageviews: 5721,
  avgSessionDuration: 185,
  bounceRate: 42.7,
}

const mockPageViews: PageViewData[] = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 30 - i), "yyyy-MM-dd"),
  value: Math.floor(Math.random() * 300) + 100,
}))

const mockTopPages: TopPage[] = [
  { page: "/", pageviews: 1245, avgTimeOnPage: 120 },
  { page: "/about", pageviews: 876, avgTimeOnPage: 95 },
  { page: "/services", pageviews: 654, avgTimeOnPage: 85 },
  { page: "/contact", pageviews: 432, avgTimeOnPage: 65 },
  { page: "/blog", pageviews: 321, avgTimeOnPage: 110 },
  { page: "/pricing", pageviews: 234, avgTimeOnPage: 75 },
  { page: "/faq", pageviews: 198, avgTimeOnPage: 90 },
]

const mockDemographics: DemographicData[] = [
  { country: "United States", users: 450 },
  { country: "United Kingdom", users: 320 },
  { country: "Canada", users: 280 },
  { country: "Australia", users: 190 },
  { country: "Germany", users: 150 },
  { country: "France", users: 120 },
  { country: "India", users: 90 },
]

const mockTrafficSources: TrafficSource[] = [
  { source: "Google", sessions: 780 },
  { source: "Direct", sessions: 540 },
  { source: "Facebook", sessions: 320 },
  { source: "Twitter", sessions: 210 },
  { source: "LinkedIn", sessions: 180 },
  { source: "Bing", sessions: 120 },
  { source: "Instagram", sessions: 90 },
]

const mockDevices: DeviceData[] = [
  { device: "Desktop", sessions: 980 },
  { device: "Mobile", sessions: 720 },
  { device: "Tablet", sessions: 190 },
]

// Add safe date parsing function to handle invalid dates
const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null

  const parsedDate = new Date(dateString)

  // Check if date is valid (Invalid Date objects return NaN when converted to number)
  return isNaN(parsedDate.getTime()) ? null : parsedDate
}

// Add safe date formatting function
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "N/A"

  try {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Date formatting error:", error)
    return "Invalid date"
  }
}

export default function OrizenAnalytics() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    success: true,
    message: "Your Google Analytics connection is working properly.",
    dataAvailable: false,
  })
  const [environmentVariables, setEnvironmentVariables] = useState<EnvironmentVariable[]>([
    {
      name: "Google Client Email",
      value: "GOOGLE_CLIENT_EMAIL",
      status: "present",
    },
    {
      name: "Google Private Key",
      value: "GOOGLE_PRIVATE_KEY",
      status: "present",
    },
    {
      name: "Google Analytics View ID",
      value: "GOOGLE_ANALYTICS_VIEW_ID",
      status: "present",
      details: "(G-H5RQYL16TB)",
    },
  ])

  const [date, setDate] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null)
  const [pageViews, setPageViews] = useState<PageViewData[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [demographics, setDemographics] = useState<DemographicData[]>([])
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([])
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState({
    summary: true,
    pageViews: true,
    topPages: true,
    demographics: true,
    trafficSources: true,
    devices: true,
  })

  const [useMockData, setUseMockData] = useState(false)

  // Format date for API requests
  const formatDateForApi = (date: Date) => format(date, "yyyy-MM-dd")

  // Function to refresh the connection status
  const refreshConnection = async () => {
    setIsRefreshing(true)

    // Simulate API call with a delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update last refreshed time
    setLastRefreshed(new Date())
    setIsRefreshing(false)
  }

  // Auto refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        refreshConnection()
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(intervalId)
  }, [])

  // Navigate to test connection page
  const navigateToTest = () => {
    router.push("/app/admin/orizen-analytics/test")
  }

  // Fetch data when date range changes
  useEffect(() => {
    if (!date.from || !date.to) return

    const startDate = formatDateForApi(date.from)
    const endDate = formatDateForApi(date.to)

    // Fetch summary metrics
    setLoading((prev) => ({ ...prev, summary: true }))
    fetch(`/api/admin/analytics/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setSummaryMetrics(data)
        setLoading((prev) => ({ ...prev, summary: false }))
      })
      .catch((err) => {
        console.error("Error fetching summary metrics:", err)
        setErrors((prev) => ({ ...prev, summary: err.message }))
        setLoading((prev) => ({ ...prev, summary: false }))
        if (useMockData) setSummaryMetrics(mockSummaryMetrics)
      })

    // Fetch page views
    setLoading((prev) => ({ ...prev, pageViews: true }))
    fetch(`/api/admin/analytics/pageviews?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array before setting state
        setPageViews(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, pageViews: false }))
      })
      .catch((err) => {
        console.error("Error fetching page views:", err)
        setErrors((prev) => ({ ...prev, pageViews: err.message }))
        setLoading((prev) => ({ ...prev, pageViews: false }))
        if (useMockData) setPageViews(mockPageViews)
      })

    // Fetch top pages
    setLoading((prev) => ({ ...prev, topPages: true }))
    fetch(`/api/admin/analytics/top-pages?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array before setting state
        setTopPages(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, topPages: false }))
      })
      .catch((err) => {
        console.error("Error fetching top pages:", err)
        setErrors((prev) => ({ ...prev, topPages: err.message }))
        setLoading((prev) => ({ ...prev, topPages: false }))
        if (useMockData) setTopPages(mockTopPages)
      })

    // Fetch demographics
    setLoading((prev) => ({ ...prev, demographics: true }))
    fetch(`/api/admin/analytics/demographics?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array before setting state
        setDemographics(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, demographics: false }))
      })
      .catch((err) => {
        console.error("Error fetching demographics:", err)
        setErrors((prev) => ({ ...prev, demographics: err.message }))
        setLoading((prev) => ({ ...prev, demographics: false }))
        if (useMockData) setDemographics(mockDemographics)
      })

    // Fetch traffic sources
    setLoading((prev) => ({ ...prev, trafficSources: true }))
    fetch(`/api/admin/analytics/traffic-sources?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array before setting state
        setTrafficSources(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, trafficSources: false }))
      })
      .catch((err) => {
        console.error("Error fetching traffic sources:", err)
        setErrors((prev) => ({ ...prev, trafficSources: err.message }))
        setLoading((prev) => ({ ...prev, trafficSources: false }))
        if (useMockData) setTrafficSources(mockTrafficSources)
      })

    // Fetch device categories
    setLoading((prev) => ({ ...prev, devices: true }))
    fetch(`/api/admin/analytics/devices?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array before setting state
        setDevices(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, devices: false }))
      })
      .catch((err) => {
        console.error("Error fetching device categories:", err)
        setErrors((prev) => ({ ...prev, devices: err.message }))
        setLoading((prev) => ({ ...prev, devices: false }))
        if (useMockData) setDevices(mockDevices)
      })
  }, [date, useMockData])

  // Format time duration (seconds to minutes and seconds)
  const formatDuration = (durationInSeconds: number | undefined): string => {
    if (durationInSeconds === undefined) {
      return "N/A"
    }

    const minutes = Math.floor(durationInSeconds / 60)
    const seconds = Math.floor(durationInSeconds % 60)

    return `${minutes}m ${seconds}s`
  }

  // Preset date ranges
  const selectDateRange = (days: number) => {
    setDate({
      from: subDays(new Date(), days),
      to: new Date(),
    })
  }

  // Safe slice function that checks if the input is an array
  const safeSlice = (arr: any[], start: number, end?: number) => {
    if (!Array.isArray(arr)) return []
    return arr.slice(start, end)
  }

  // Check if there are any errors
  const hasErrors = Object.keys(errors).length > 0

  // Mock data fetch with error handling
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data with proper date handling
        const currentDate = new Date()
        const startDate = new Date()
        startDate.setDate(currentDate.getDate() - 7) // One week ago

        setAnalyticsData({
          stats: {
            users: { value: 2543, change: 12.5, trend: "up" },
            documents: { value: 8942, change: 23.1, trend: "up" },
            revenue: { value: 42389, change: -3.2, trend: "down" },
            tasks: { value: 47, change: 5.3, trend: "up" },
          },
          dateRange: {
            start: startDate,
            end: currentDate,
          },
          // Other analytics data...
        })
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError("Failed to load analytics data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [timeRange])

  // Handle time range change with error handling
  const handleTimeRangeChange = (range: string) => {
    try {
      setTimeRange(range)
    } catch (err) {
      console.error("Error changing time range:", err)
      setError("Failed to update time range. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  // Format date range safely
  const formattedStartDate = formatDate(analyticsData?.dateRange?.start)
  const formattedEndDate = formatDate(analyticsData?.dateRange?.end)
  const dateRangeDisplay = `${formattedStartDate} - ${formattedEndDate}`

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orizen Analytics</h1>
          <p className="text-gray-500 mt-1">Track performance metrics and business insights</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center mb-6 bg-white p-3 rounded-lg shadow-sm">
        <span className="text-sm font-medium mr-3">Time Range:</span>
        <div className="flex space-x-2">
          {["day", "week", "month", "quarter", "year"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTimeRangeChange(range)}
              className={timeRange === range ? "bg-[#00B6FF] text-white" : ""}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm text-gray-500">{dateRangeDisplay}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value={analyticsData.stats.users.value.toLocaleString()}
          change={`${analyticsData.stats.users.change}%`}
          trend={analyticsData.stats.users.trend}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Documents"
          value={analyticsData.stats.documents.value.toLocaleString()}
          change={`${analyticsData.stats.documents.change}%`}
          trend={analyticsData.stats.documents.trend}
          icon={FileText}
          color="bg-green-500"
        />
        <StatCard
          title="Revenue"
          value={`$${analyticsData.stats.revenue.value.toLocaleString()}`}
          change={`${analyticsData.stats.revenue.change}%`}
          trend={analyticsData.stats.revenue.trend}
          icon={CreditCard}
          color="bg-[#00B6FF]"
        />
        <StatCard
          title="Pending Tasks"
          value={analyticsData.stats.tasks.value.toString()}
          change={`${analyticsData.stats.tasks.change}%`}
          trend={analyticsData.stats.tasks.trend}
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="documents">Document Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Activity and Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <ActivityItem
                  icon={<Users className="h-4 w-4 text-blue-500" />}
                  title="New user registered"
                  description="John Smith created a new account"
                  time="5 minutes ago"
                />
                <ActivityItem
                  icon={<FileText className="h-4 w-4 text-green-500" />}
                  title="Document uploaded"
                  description="Annual report for Rapid Ventures LLC"
                  time="1 hour ago"
                />
                <ActivityItem
                  icon={<CreditCard className="h-4 w-4 text-[#00B6FF]" />}
                  title="Payment processed"
                  description="$1,299 from Acme Corp"
                  time="3 hours ago"
                />
                <ActivityItem
                  icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                  title="Compliance alert"
                  description="5 users have pending document submissions"
                  time="5 hours ago"
                />
                <ActivityItem
                  icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                  title="Task completed"
                  description="Quarterly tax filing for Blue Ocean Inc"
                  time="Yesterday"
                  border={false}
                />
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Compliance Status</h3>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <ComplianceItem title="Document Verification" value={85} color="bg-green-500" />
                  <ComplianceItem title="User Identity Verification" value={72} color="bg-amber-500" />
                  <ComplianceItem title="Annual Report Submissions" value={94} color="bg-green-500" />
                  <ComplianceItem title="Tax Compliance" value={68} color="bg-amber-500" />
                  <ComplianceItem title="Data Protection" value={98} color="bg-green-500" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">User Analytics</h3>
              <p className="text-gray-500 mb-6">Detailed metrics about user activity and growth.</p>
              <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">User analytics chart will be displayed here</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Document Analytics</h3>
              <p className="text-gray-500 mb-6">Insights about document usage and processing.</p>
              <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Document analytics chart will be displayed here</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Revenue Analytics</h3>
              <p className="text-gray-500 mb-6">Financial performance and revenue trends.</p>
              <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Revenue analytics chart will be displayed here</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Component for stats cards
interface StatCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ElementType
  color: string
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-gray-500 text-sm">{title}</p>
      </div>
    </Card>
  )
}

// Component for activity items
interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  border?: boolean
}

function ActivityItem({ icon, title, description, time, border = true }: ActivityItemProps) {
  return (
    <div className={`flex items-start py-3 ${border ? "border-b" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-1">{description}</p>
      </div>
      <div className="text-gray-400 text-xs">{time}</div>
    </div>
  )
}

// Component for compliance items
interface ComplianceItemProps {
  title: string
  value: number
  color: string
}

function ComplianceItem({ title, value, color }: ComplianceItemProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" data-indicator-color={color} />
    </div>
  )
}
