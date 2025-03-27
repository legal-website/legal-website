"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Eye, Clock, MousePointerClick } from "lucide-react"
import { format, subDays } from "date-fns"
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

// Types
// Update the DateRange interface to match react-day-picker's type
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

export default function AnalyticsDashboard() {
  // Update the useState initialization to handle undefined values
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

  const [loading, setLoading] = useState({
    summary: true,
    pageViews: true,
    topPages: true,
    demographics: true,
    trafficSources: true,
    devices: true,
  })

  // Format date for API requests
  const formatDateForApi = (date: Date) => format(date, "yyyy-MM-dd")

  // Fetch data when date range changes
  useEffect(() => {
    if (!date.from || !date.to) return

    const startDate = formatDateForApi(date.from)
    const endDate = formatDateForApi(date.to)

    // Fetch summary metrics
    setLoading((prev) => ({ ...prev, summary: true }))
    fetch(`/api/admin/analytics/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        setSummaryMetrics(data)
        setLoading((prev) => ({ ...prev, summary: false }))
      })
      .catch((err) => {
        console.error("Error fetching summary metrics:", err)
        setLoading((prev) => ({ ...prev, summary: false }))
      })

    // Fetch page views
    setLoading((prev) => ({ ...prev, pageViews: true }))
    fetch(`/api/admin/analytics/pageviews?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setPageViews(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, pageViews: false }))
      })
      .catch((err) => {
        console.error("Error fetching page views:", err)
        setLoading((prev) => ({ ...prev, pageViews: false }))
      })

    // Fetch top pages
    setLoading((prev) => ({ ...prev, topPages: true }))
    fetch(`/api/admin/analytics/top-pages?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setTopPages(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, topPages: false }))
      })
      .catch((err) => {
        console.error("Error fetching top pages:", err)
        setLoading((prev) => ({ ...prev, topPages: false }))
      })

    // Fetch demographics
    setLoading((prev) => ({ ...prev, demographics: true }))
    fetch(`/api/admin/analytics/demographics?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setDemographics(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, demographics: false }))
      })
      .catch((err) => {
        console.error("Error fetching demographics:", err)
        setLoading((prev) => ({ ...prev, demographics: false }))
      })

    // Fetch traffic sources
    setLoading((prev) => ({ ...prev, trafficSources: true }))
    fetch(`/api/admin/analytics/traffic-sources?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setTrafficSources(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, trafficSources: false }))
      })
      .catch((err) => {
        console.error("Error fetching traffic sources:", err)
        setLoading((prev) => ({ ...prev, trafficSources: false }))
      })

    // Fetch device categories
    setLoading((prev) => ({ ...prev, devices: true }))
    fetch(`/api/admin/analytics/devices?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setDevices(Array.isArray(data) ? data : [])
        setLoading((prev) => ({ ...prev, devices: false }))
      })
      .catch((err) => {
        console.error("Error fetching device categories:", err)
        setLoading((prev) => ({ ...prev, devices: false }))
      })
  }, [date])

  // Format time duration (seconds to minutes and seconds)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
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

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orizen Analytics Dashboard</h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => selectDateRange(7)}>
            Last 7 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => selectDateRange(30)}>
            Last 30 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => selectDateRange(90)}>
            Last 90 days
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              {/* Fix the onSelect handler to handle undefined values */}
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date.from || new Date()}
                selected={date}
                onSelect={(range) => range && setDate(range as DateRange)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summaryMetrics?.users.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {summaryMetrics?.newUsers.toLocaleString() || 0} new users
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
                <div className="text-2xl font-bold">{summaryMetrics?.pageviews.toLocaleString() || 0}</div>
                {/* Fix the pageviews per session calculation to handle undefined */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Page Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.pageViews ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  pageviews: {
                    label: "Page Views",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pageViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "MMM d")} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-4">
                {/* Use the safe slice function */}
                {safeSlice(topPages, 0, 7).map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-medium text-sm truncate max-w-[250px]" title={page.page}>
                        {page.page}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{page.pageviews.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{formatDuration(page.avgTimeOnPage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent>
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {/* Use the safe slice function */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {/* Use the safe slice function */}
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
          <CardHeader>
            <CardTitle>Device Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.devices ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
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

