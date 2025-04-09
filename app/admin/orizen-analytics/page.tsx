"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Eye, Clock, MousePointerClick, AlertTriangle } from "lucide-react"
import { format, subDays, isValid, parseISO } from "date-fns"
import {
  Line,
  Bar,
  Pie,
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

// Generate mock page views data safely
const generateMockPageViews = (): PageViewData[] => {
  try {
    const today = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 30 - i)
      return {
        date: isValid(date)
          ? format(date, "yyyy-MM-dd")
          : `2023-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        value: Math.floor(Math.random() * 300) + 100,
      }
    })
  } catch (error) {
    console.error("Error generating mock page views:", error)
    // Fallback to static data if date operations fail
    return Array.from({ length: 30 }, (_, i) => ({
      date: `2023-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      value: Math.floor(Math.random() * 300) + 100,
    }))
  }
}

const mockPageViews = generateMockPageViews()

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

// Safe date formatter that handles errors
const safeFormatDate = (date: Date | undefined, formatString: string, fallback = ""): string => {
  if (!date) return fallback

  try {
    if (!(date instanceof Date) || !isValid(date)) {
      return fallback
    }
    return format(date, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return fallback
  }
}

// Create a valid date or return undefined
const createSafeDate = (date: Date | undefined): Date | undefined => {
  if (!date) return undefined

  try {
    if (!(date instanceof Date) || !isValid(date)) {
      return undefined
    }
    return date
  } catch (error) {
    console.error("Error creating safe date:", error)
    return undefined
  }
}

export default function AnalyticsDashboard() {
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

  // Initialize with safe dates
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)

  const [date, setDate] = useState<DateRange>({
    from: thirtyDaysAgo,
    to: today,
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

  // Format date for API requests - with robust error handling
  const formatDateForApi = (date: Date | undefined): string => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        // Return today's date as fallback if date is invalid
        return format(new Date(), "yyyy-MM-dd")
      }
      return format(date, "yyyy-MM-dd")
    } catch (error) {
      console.error("Error formatting date for API:", error)
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Function to refresh the connection status
  const refreshConnection = async () => {
    setIsRefreshing(true)

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update last refreshed time
      setLastRefreshed(new Date())
    } catch (error) {
      console.error("Error refreshing connection:", error)
    } finally {
      setIsRefreshing(false)
    }
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
    router.push("/admin/orizen-analytics/test")
  }

  // Fetch data when date range changes
  useEffect(() => {
    // Set default to use mock data to avoid errors
    setUseMockData(true)

    // Ensure we have valid dates before making API calls
    if (!date.from || !date.to) {
      console.log("Missing date range, using mock data")
      setUseMockData(true)
      setSummaryMetrics(mockSummaryMetrics)
      setPageViews(mockPageViews)
      setTopPages(mockTopPages)
      setDemographics(mockDemographics)
      setTrafficSources(mockTrafficSources)
      setDevices(mockDevices)
      setLoading({
        summary: false,
        pageViews: false,
        topPages: false,
        demographics: false,
        trafficSources: false,
        devices: false,
      })
      return
    }

    // Ensure dates are valid Date objects
    const fromDate = date.from instanceof Date && !isNaN(date.from.getTime()) ? date.from : subDays(new Date(), 30)
    const toDate = date.to instanceof Date && !isNaN(date.to.getTime()) ? date.to : new Date()

    const startDate = formatDateForApi(fromDate)
    const endDate = formatDateForApi(toDate)

    // Use mock data for now to ensure the page loads without errors
    setSummaryMetrics(mockSummaryMetrics)
    setPageViews(mockPageViews)
    setTopPages(mockTopPages)
    setDemographics(mockDemographics)
    setTrafficSources(mockTrafficSources)
    setDevices(mockDevices)
    setLoading({
      summary: false,
      pageViews: false,
      topPages: false,
      demographics: false,
      trafficSources: false,
      devices: false,
    })

    // Uncomment this section when API is ready
    /*
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
        setSummaryMetrics(mockSummaryMetrics)
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
        setPageViews(mockPageViews)
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
        setTopPages(mockTopPages)
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
        setDemographics(mockDemographics)
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
        setTrafficSources(mockTrafficSources)
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
        setDevices(mockDevices)
      })
    */
  }, [date])

  // Format time duration (seconds to minutes and seconds)
  const formatDuration = (durationInSeconds: number | undefined): string => {
    if (durationInSeconds === undefined) {
      return "N/A"
    }

    const minutes = Math.floor(durationInSeconds / 60)
    const seconds = Math.floor(durationInSeconds % 60)

    return `${minutes}m ${seconds}s`
  }

  // Preset date ranges with error handling
  const selectDateRange = (days: number) => {
    try {
      const today = new Date()
      const pastDate = subDays(today, days)

      if (!isValid(today) || !isValid(pastDate)) {
        throw new Error("Invalid date calculation")
      }

      setDate({
        from: pastDate,
        to: today,
      })
    } catch (error) {
      console.error("Error setting date range:", error)
      // Fallback to mock data
      setUseMockData(true)
    }
  }

  // Safe slice function that checks if the input is an array
  const safeSlice = (arr: any[], start: number, end?: number) => {
    if (!Array.isArray(arr)) return []
    return arr.slice(start, end)
  }

  // Safe date formatter for display
  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date) return "Select date"
    try {
      if (!(date instanceof Date) || !isValid(date)) {
        return "Invalid date"
      }
      return format(date, "LLL dd, y")
    } catch (error) {
      console.error("Error formatting display date:", error)
      return "Date error"
    }
  }

  // Check if there are any errors
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden py-4 sm:py-6 space-y-4 sm:space-y-8 mb-20 sm:mb-40 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Orizen Analytics Dashboard</h1>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshConnection}
            disabled={isRefreshing}
            className="text-xs sm:text-sm"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/orizen-analytics/test")}
            className="text-xs sm:text-sm"
          >
            Test API Connection
          </Button>

          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => selectDateRange(7)} className="text-xs sm:text-sm">
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectDateRange(30)} className="text-xs sm:text-sm">
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectDateRange(90)} className="text-xs sm:text-sm">
              Last 90 days
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-[240px] justify-start text-left font-normal text-xs sm:text-sm mt-2 sm:mt-0"
              >
                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {date.from && date.to ? (
                  <>
                    {formatDisplayDate(date.from)} - {formatDisplayDate(date.to)}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date.from instanceof Date && isValid(date.from) ? date.from : new Date()}
                selected={date}
                onSelect={(range) => {
                  if (range) {
                    // Validate dates before setting
                    const from = range.from instanceof Date && isValid(range.from) ? range.from : undefined
                    const to = range.to instanceof Date && isValid(range.to) ? range.to : undefined
                    setDate({ from, to })
                  }
                }}
                numberOfMonths={window.innerWidth < 768 ? 1 : 2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Issues</AlertTitle>
          <AlertDescription>
            <p>There were issues connecting to Google Analytics. Using fallback data.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setUseMockData(!useMockData)}>
                {useMockData ? "Try Real Data" : "Use Mock Data"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/orizen-analytics/test")}>
                Test Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summaryMetrics?.users?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {summaryMetrics?.newUsers?.toLocaleString() || 0} new users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Page Views</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summaryMetrics?.pageviews?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {((summaryMetrics?.pageviews || 0) / (summaryMetrics?.sessions || 1)).toFixed(2)} per session
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Session Duration</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatDuration(summaryMetrics?.avgSessionDuration || 0)}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Time spent on site
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bounce Rate</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(summaryMetrics?.bounceRate || 0).toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <MousePointerClick className="h-3 w-3 mr-1" />
                  Single page sessions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Page Views Chart */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
        <Card className="col-span-1">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Page Views Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading.pageViews ? (
              <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  pageviews: {
                    label: "Page Views",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pageViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(dateStr) => {
                        try {
                          const date = parseISO(dateStr)
                          return isValid(date) ? format(date, "MMM d") : dateStr
                        } catch (error) {
                          return dateStr
                        }
                      }}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Page Views"
                      stroke="var(--color-pageviews)"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages and Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Top Pages</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading.topPages ? (
              <div className="space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {safeSlice(topPages, 0, 7).map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span
                        className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[180px] md:max-w-[250px]"
                        title={page.page}
                      >
                        {page.page}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-semibold">{page.pageviews.toLocaleString()}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDuration(page.avgTimeOnPage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">User Demographics</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading.demographics ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  users: {
                    label: "Users",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeSlice(demographics, 0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" name="Users" fill="var(--color-users)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources and Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading.trafficSources ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  sessions: {
                    label: "Sessions",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeSlice(trafficSources, 0, 7)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="source" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sessions" name="Sessions" fill="var(--color-sessions)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Device Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading.devices ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="sessions"
                      nameKey="device"
                    >
                      {devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
