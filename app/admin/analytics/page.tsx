"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
  Activity,
  BarChart2,
  PieChart,
  LineChart,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center mb-6 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
        <span className="text-sm font-medium mr-3">Time Range:</span>
        <div className="flex space-x-2">
          {["day", "week", "month", "quarter", "year"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? "bg-purple-600 text-white" : ""}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm text-gray-500">Mar 1, 2025 - Mar 31, 2025</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Revenue"
          value="$128,430"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="bg-green-500"
        />
        <MetricCard title="New Users" value="342" change="+8.2%" trend="up" icon={Users} color="bg-blue-500" />
        <MetricCard
          title="Document Uploads"
          value="1,842"
          change="-3.1%"
          trend="down"
          icon={FileText}
          color="bg-purple-500"
        />
        <MetricCard
          title="Conversion Rate"
          value="24.8%"
          change="+2.3%"
          trend="up"
          icon={TrendingUp}
          color="bg-amber-500"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue and User Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Revenue Overview</h3>
                  <select className="text-sm border rounded-md px-2 py-1">
                    <option>Last 30 days</option>
                    <option>Last quarter</option>
                    <option>Last year</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="h-80 w-full">
                  {/* This would be a chart in a real implementation */}
                  <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <LineChart className="h-16 w-16 text-gray-300" />
                    <span className="ml-4 text-gray-400">Revenue Chart</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">User Growth</h3>
                  <select className="text-sm border rounded-md px-2 py-1">
                    <option>Last 30 days</option>
                    <option>Last quarter</option>
                    <option>Last year</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="h-80 w-full">
                  {/* This would be a chart in a real implementation */}
                  <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-16 w-16 text-gray-300" />
                    <span className="ml-4 text-gray-400">User Growth Chart</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Products and Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Top Products</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <ProductPerformanceItem name="LLC Formation Package" revenue="$42,580" sales={215} growth="+12.5%" />
                  <ProductPerformanceItem
                    name="Registered Agent Service"
                    revenue="$28,350"
                    sales={189}
                    growth="+8.3%"
                  />
                  <ProductPerformanceItem name="Annual Report Filing" revenue="$18,720" sales={156} growth="+15.2%" />
                  <ProductPerformanceItem
                    name="Business License Package"
                    revenue="$15,840"
                    sales={132}
                    growth="-2.1%"
                    trend="down"
                  />
                  <ProductPerformanceItem
                    name="Tax Preparation Service"
                    revenue="$12,450"
                    sales={83}
                    growth="+5.7%"
                    border={false}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Conversion Funnel</h3>
              </div>
              <div className="p-6">
                <div className="h-80 w-full">
                  {/* This would be a chart in a real implementation */}
                  <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Activity className="h-16 w-16 text-gray-300" />
                    <span className="ml-4 text-gray-400">Conversion Funnel Chart</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Geographic Distribution and Device Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Geographic Distribution</h3>
              </div>
              <div className="p-6">
                <div className="h-80 w-full">
                  {/* This would be a map chart in a real implementation */}
                  <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Geographic Map</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Device & Browser Usage</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Device Type</h4>
                    <div className="h-40 w-full">
                      {/* This would be a pie chart in a real implementation */}
                      <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <PieChart className="h-10 w-10 text-gray-300" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Desktop</span>
                        <span className="text-sm font-medium">58%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mobile</span>
                        <span className="text-sm font-medium">32%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tablet</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-4">Browser</h4>
                    <div className="h-40 w-full">
                      {/* This would be a pie chart in a real implementation */}
                      <div className="h-full w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <PieChart className="h-10 w-10 text-gray-300" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Chrome</span>
                        <span className="text-sm font-medium">64%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Safari</span>
                        <span className="text-sm font-medium">18%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Firefox</span>
                        <span className="text-sm font-medium">12%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Edge</span>
                        <span className="text-sm font-medium">6%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">User Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Active Users</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">2,543</p>
                      <p className="text-sm text-green-500">+12.5% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">New Signups</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">342</p>
                      <p className="text-sm text-green-500">+8.2% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Churn Rate</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">2.4%</p>
                      <p className="text-sm text-red-500">+0.3% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-4">User Growth Trend</h4>
                <div className="h-80 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-gray-300" />
                  <span className="ml-4 text-gray-400">User Growth Chart</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">User Segments</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <PieChart className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">User Segments Chart</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">User Retention</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Activity className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">User Retention Chart</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Top User Locations</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">Location</th>
                      <th className="text-left p-3 font-medium text-sm">Users</th>
                      <th className="text-left p-3 font-medium text-sm">Growth</th>
                      <th className="text-left p-3 font-medium text-sm">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">United States</td>
                      <td className="p-3">1,245</td>
                      <td className="p-3 text-green-500">+12.5%</td>
                      <td className="p-3">24.8%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Canada</td>
                      <td className="p-3">432</td>
                      <td className="p-3 text-green-500">+8.2%</td>
                      <td className="p-3">22.3%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">United Kingdom</td>
                      <td className="p-3">287</td>
                      <td className="p-3 text-green-500">+5.7%</td>
                      <td className="p-3">19.5%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Australia</td>
                      <td className="p-3">156</td>
                      <td className="p-3 text-red-500">-2.1%</td>
                      <td className="p-3">18.2%</td>
                    </tr>
                    <tr>
                      <td className="p-3">Germany</td>
                      <td className="p-3">124</td>
                      <td className="p-3 text-green-500">+3.4%</td>
                      <td className="p-3">17.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Revenue Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">$128,430</p>
                      <p className="text-sm text-green-500">+12.5% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">$245.80</p>
                      <p className="text-sm text-green-500">+3.2% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">MRR</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">$42,580</p>
                      <p className="text-sm text-green-500">+8.7% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-4">Revenue Trend</h4>
                <div className="h-80 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-gray-300" />
                  <span className="ml-4 text-gray-400">Revenue Trend Chart</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue by Product</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <PieChart className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">Revenue by Product Chart</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue by Channel</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">Revenue by Channel Chart</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Top Revenue Sources</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">Product</th>
                      <th className="text-left p-3 font-medium text-sm">Revenue</th>
                      <th className="text-left p-3 font-medium text-sm">Growth</th>
                      <th className="text-left p-3 font-medium text-sm">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">LLC Formation Package</td>
                      <td className="p-3">$42,580</td>
                      <td className="p-3 text-green-500">+12.5%</td>
                      <td className="p-3">215</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Registered Agent Service</td>
                      <td className="p-3">$28,350</td>
                      <td className="p-3 text-green-500">+8.3%</td>
                      <td className="p-3">189</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Annual Report Filing</td>
                      <td className="p-3">$18,720</td>
                      <td className="p-3 text-green-500">+15.2%</td>
                      <td className="p-3">156</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Business License Package</td>
                      <td className="p-3">$15,840</td>
                      <td className="p-3 text-red-500">-2.1%</td>
                      <td className="p-3">132</td>
                    </tr>
                    <tr>
                      <td className="p-3">Tax Preparation Service</td>
                      <td className="p-3">$12,450</td>
                      <td className="p-3 text-green-500">+5.7%</td>
                      <td className="p-3">83</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Document Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Total Documents</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">8,942</p>
                      <p className="text-sm text-green-500">+23.1% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Document Uploads</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">1,842</p>
                      <p className="text-sm text-red-500">-3.1% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Template Usage</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">3,456</p>
                      <p className="text-sm text-green-500">+15.7% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-4">Document Activity Over Time</h4>
                <div className="h-80 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-gray-300" />
                  <span className="ml-4 text-gray-400">Document Activity Chart</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Documents by Type</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <PieChart className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">Documents by Type Chart</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Document Processing Time</h4>
                  <div className="h-60 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Clock className="h-12 w-12 text-gray-300" />
                    <span className="ml-4 text-gray-400">Processing Time Chart</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Most Used Templates</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">Template</th>
                      <th className="text-left p-3 font-medium text-sm">Usage Count</th>
                      <th className="text-left p-3 font-medium text-sm">Growth</th>
                      <th className="text-left p-3 font-medium text-sm">Avg. Completion Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Articles of Organization</td>
                      <td className="p-3">342</td>
                      <td className="p-3 text-green-500">+12.5%</td>
                      <td className="p-3">8 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Operating Agreement</td>
                      <td className="p-3">287</td>
                      <td className="p-3 text-green-500">+8.3%</td>
                      <td className="p-3">15 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Annual Report Template</td>
                      <td className="p-3">156</td>
                      <td className="p-3 text-green-500">+15.2%</td>
                      <td className="p-3">12 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Tax Filing Checklist</td>
                      <td className="p-3">98</td>
                      <td className="p-3 text-red-500">-2.1%</td>
                      <td className="p-3">5 min</td>
                    </tr>
                    <tr>
                      <td className="p-3">Employee Handbook</td>
                      <td className="p-3">75</td>
                      <td className="p-3 text-green-500">+5.7%</td>
                      <td className="p-3">22 min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Compliance Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Overall Compliance</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">87%</p>
                      <p className="text-sm text-green-500">+3.5% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Pending Verifications</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">124</p>
                      <p className="text-sm text-red-500">+12.7% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Compliance Alerts</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">18</p>
                      <p className="text-sm text-red-500">+5.2% vs last month</p>
                    </div>
                    <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-4">Compliance Trend</h4>
                <div className="h-80 w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-gray-300" />
                  <span className="ml-4 text-gray-400">Compliance Trend Chart</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Compliance by Category</h4>
                  <div className="space-y-4">
                    <ComplianceItem title="Document Verification" value={85} color="bg-green-500" />
                    <ComplianceItem title="User Identity Verification" value={72} color="bg-amber-500" />
                    <ComplianceItem title="Annual Report Submissions" value={94} color="bg-green-500" />
                    <ComplianceItem title="Tax Compliance" value={68} color="bg-amber-500" />
                    <ComplianceItem title="Data Protection" value={98} color="bg-green-500" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Recent Compliance Alerts</h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Alert</th>
                        <th className="text-left p-3 font-medium text-sm">User/Company</th>
                        <th className="text-left p-3 font-medium text-sm">Date</th>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Missing Annual Report</td>
                        <td className="p-3">Rapid Ventures LLC</td>
                        <td className="p-3">Mar 7, 2025</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Critical
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Expired Business License</td>
                        <td className="p-3">Blue Ocean Inc</td>
                        <td className="p-3">Mar 5, 2025</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Warning
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Incomplete Tax Filing</td>
                        <td className="p-3">Summit Solutions</td>
                        <td className="p-3">Mar 3, 2025</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Warning
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Unverified User Identity</td>
                        <td className="p-3">John Smith</td>
                        <td className="p-3">Mar 2, 2025</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Info
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Missing Contact Information</td>
                        <td className="p-3">Horizon Group</td>
                        <td className="p-3">Mar 1, 2025</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Info
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Component for metric cards
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <div className="p-6 mb-40">
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      </div>
    </Card>
  )
}

// Component for product performance items
function ProductPerformanceItem({
  name,
  revenue,
  sales,
  growth,
  trend = "up",
  border = true,
}: {
  name: string
  revenue: string
  sales: number
  growth: string
  trend?: "up" | "down"
  border?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${border ? "border-b" : ""}`}>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{sales} sales</p>
      </div>
      <div className="text-right">
        <p className="font-medium">{revenue}</p>
        <p className={`text-sm ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
          {trend === "up" ? (
            <ArrowUpRight className="h-3 w-3 inline mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 inline mr-1" />
          )}
          {growth}
        </p>
      </div>
    </div>
  )
}

// Component for compliance items
function ComplianceItem({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <Progress value={value} className={`h-2 ${color}`} />
    </div>
  )
}

