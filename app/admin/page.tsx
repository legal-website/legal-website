"use client"

import type React from "react"

import { useState } from "react"
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, John. Here&apos;s whats happening today.</p>
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
          <span className="text-sm text-gray-500">Mar 1, 2025 - Mar 8, 2025</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Users" value="2,543" change="+12.5%" trend="up" icon={Users} color="bg-blue-500" />
        <StatCard
          title="Active Documents"
          value="8,942"
          change="+23.1%"
          trend="up"
          icon={FileText}
          color="bg-green-500"
        />
        <StatCard title="Revenue" value="$42,389" change="-3.2%" trend="down" icon={CreditCard} color="bg-purple-500" />
        <StatCard title="Pending Tasks" value="47" change="+5.3%" trend="up" icon={Clock} color="bg-amber-500" />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="documents">Document Management</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Activity and Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">System Activity</h3>
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
                  icon={<CreditCard className="h-4 w-4 text-purple-500" />}
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

          {/* Recent Users and Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Users</h3>
                  <Button variant="ghost" size="sm">
                    View All Users
                  </Button>
                </div>
              </div>
              <div className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">Name</th>
                      <th className="text-left p-4 font-medium text-sm">Company</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <UserRow
                      name="Sarah Johnson"
                      email="sarah@example.com"
                      company="Rapid Ventures LLC"
                      status="Active"
                    />
                    <UserRow
                      name="Michael Chen"
                      email="michael@example.com"
                      company="Blue Ocean Inc"
                      status="Pending"
                    />
                    <UserRow
                      name="Emily Rodriguez"
                      email="emily@example.com"
                      company="Summit Solutions"
                      status="Active"
                    />
                    <UserRow
                      name="David Kim"
                      email="david@example.com"
                      company="Horizon Group"
                      status="Inactive"
                      border={false}
                    />
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Documents</h3>
                  <Button variant="ghost" size="sm">
                    View All Documents
                  </Button>
                </div>
              </div>
              <div className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">Document</th>
                      <th className="text-left p-4 font-medium text-sm">Company</th>
                      <th className="text-left p-4 font-medium text-sm">Date</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DocumentRow name="Annual Report 2024" company="Rapid Ventures LLC" date="Mar 7, 2025" />
                    <DocumentRow name="Tax Filing Q1" company="Blue Ocean Inc" date="Mar 5, 2025" />
                    <DocumentRow name="Business License" company="Summit Solutions" date="Mar 3, 2025" />
                    <DocumentRow name="Operating Agreement" company="Horizon Group" date="Mar 1, 2025" border={false} />
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">User Management</h3>
              <p className="text-gray-500 mb-6">Manage all users, approve new registrations, and assign roles.</p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    All Users
                  </Button>
                  <Button variant="outline" size="sm">
                    Active
                  </Button>
                  <Button variant="outline" size="sm">
                    Pending
                  </Button>
                  <Button variant="outline" size="sm">
                    Inactive
                  </Button>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">Add New User</Button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Pending Approvals (3)</h4>
                <p className="text-sm text-gray-500 mb-4">These users require your approval to access the system</p>

                <div className="space-y-4">
                  <UserApprovalCard
                    name="Alex Thompson"
                    email="alex@example.com"
                    company="Nexus Technologies"
                    date="Mar 7, 2025"
                  />
                  <UserApprovalCard
                    name="Maria Garcia"
                    email="maria@example.com"
                    company="Stellar Innovations"
                    date="Mar 6, 2025"
                  />
                  <UserApprovalCard
                    name="James Wilson"
                    email="james@example.com"
                    company="Pinnacle Group"
                    date="Mar 5, 2025"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Document Management</h3>
              <p className="text-gray-500 mb-6">Upload, manage, and organize documents for all clients.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Document Templates</h4>
                    <span className="text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                      24 Templates
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Standard documents that can be customized for clients
                  </p>
                  <Button variant="outline" className="w-full border-blue-200 dark:border-blue-700">
                    Manage Templates
                  </Button>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Client Documents</h4>
                    <span className="text-sm bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                      8,942 Files
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Documents uploaded by or for clients</p>
                  <Button variant="outline" className="w-full border-green-200 dark:border-green-700">
                    Browse Documents
                  </Button>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Bulk Upload</h4>
                    <span className="text-sm bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-2 py-1 rounded">
                      New
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Upload multiple documents for multiple clients at once
                  </p>
                  <Button variant="outline" className="w-full border-purple-200 dark:border-purple-700">
                    Start Bulk Upload
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-4">Recent Document Activity</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">Action</th>
                      <th className="text-left p-3 font-medium text-sm">Document</th>
                      <th className="text-left p-3 font-medium text-sm">User</th>
                      <th className="text-left p-3 font-medium text-sm">Company</th>
                      <th className="text-left p-3 font-medium text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DocumentActivityRow
                      action="Uploaded"
                      document="Annual Report 2024"
                      user="Sarah Johnson"
                      company="Rapid Ventures LLC"
                      date="Mar 7, 2025 10:23 AM"
                    />
                    <DocumentActivityRow
                      action="Downloaded"
                      document="Tax Filing Q1"
                      user="Admin (You)"
                      company="Blue Ocean Inc"
                      date="Mar 7, 2025 09:45 AM"
                    />
                    <DocumentActivityRow
                      action="Edited"
                      document="Operating Agreement"
                      user="Michael Chen"
                      company="Blue Ocean Inc"
                      date="Mar 6, 2025 04:12 PM"
                    />
                    <DocumentActivityRow
                      action="Shared"
                      document="Business License"
                      user="Emily Rodriguez"
                      company="Summit Solutions"
                      date="Mar 6, 2025 02:30 PM"
                    />
                    <DocumentActivityRow
                      action="Deleted"
                      document="Draft Contract"
                      user="Admin (You)"
                      company="Horizon Group"
                      date="Mar 5, 2025 11:18 AM"
                      border={false}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Promotions Management</h3>
              <p className="text-gray-500 mb-6">Create and manage deals, coupons, and promotional campaigns.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Active Deals</h4>
                    <span className="text-sm bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-2 py-1 rounded">
                      12 Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Special offers currently available to clients
                  </p>
                  <Button variant="outline" className="w-full border-amber-200 dark:border-amber-700">
                    Manage Deals
                  </Button>
                </div>

                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Coupons</h4>
                    <span className="text-sm bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-100 px-2 py-1 rounded">
                      28 Codes
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Discount codes for services and products
                  </p>
                  <Button variant="outline" className="w-full border-pink-200 dark:border-pink-700">
                    Manage Coupons
                  </Button>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Campaigns</h4>
                    <span className="text-sm bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 px-2 py-1 rounded">
                      3 Running
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Marketing campaigns with multiple promotions
                  </p>
                  <Button variant="outline" className="w-full border-indigo-200 dark:border-indigo-700">
                    Manage Campaigns
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Current Promotions</h4>
                  <Button className="bg-purple-600 hover:bg-purple-700">Create New Promotion</Button>
                </div>

                <div className="space-y-4">
                  <PromotionCard
                    title="Spring Business Setup Special"
                    description="25% off all business formation packages"
                    code="SPRING25"
                    usageCount={142}
                    startDate="Mar 1, 2025"
                    endDate="Mar 31, 2025"
                    status="Active"
                  />

                  <PromotionCard
                    title="Compliance Bundle"
                    description="Get annual report filing and registered agent service for $199"
                    code="COMPLY199"
                    usageCount={87}
                    startDate="Feb 15, 2025"
                    endDate="Apr 15, 2025"
                    status="Active"
                  />

                  <PromotionCard
                    title="Referral Bonus"
                    description="Refer a friend and both get $50 credit"
                    code="REFER50"
                    usageCount={215}
                    startDate="Jan 1, 2025"
                    endDate="Dec 31, 2025"
                    status="Active"
                  />

                  <PromotionCard
                    title="Tax Season Special"
                    description="Free tax consultation with any business package"
                    code="TAXFREE"
                    usageCount={63}
                    startDate="Feb 1, 2025"
                    endDate="Apr 15, 2025"
                    status="Active"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Component for stats cards
function StatCard({
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      </div>
    </Card>
  )
}

// Component for activity items
function ActivityItem({
  icon,
  title,
  description,
  time,
  border = true,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  border?: boolean
}) {
  return (
    <div className={`flex items-start py-3 ${border ? "border-b" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{description}</p>
      </div>
      <div className="text-gray-400 dark:text-gray-500 text-xs">{time}</div>
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
      <Progress value={value} className={`h-2 [&>div]:${color}`} />
    </div>
  )
}

// Component for user rows
function UserRow({
  name,
  email,
  company,
  status,
  border = true,
}: {
  name: string
  email: string
  company: string
  status: string
  border?: boolean
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <tr className={border ? "border-b" : ""}>
      <td className="p-4">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </td>
      <td className="p-4">{company}</td>
      <td className="p-4">
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>{status}</span>
      </td>
      <td className="p-4">
        <Button variant="ghost" size="sm">
          View
        </Button>
      </td>
    </tr>
  )
}

// Component for document rows
function DocumentRow({
  name,
  company,
  date,
  border = true,
}: {
  name: string
  company: string
  date: string
  border?: boolean
}) {
  return (
    <tr className={border ? "border-b" : ""}>
      <td className="p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
          <span>{name}</span>
        </div>
      </td>
      <td className="p-4">{company}</td>
      <td className="p-4">{date}</td>
      <td className="p-4">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
          <Button variant="ghost" size="sm">
            Download
          </Button>
        </div>
      </td>
    </tr>
  )
}

// Component for user approval cards
function UserApprovalCard({
  name,
  email,
  company,
  date,
}: {
  name: string
  email: string
  company: string
  date: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between">
      <div className="mb-4 md:mb-0">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{email}</p>
        <div className="flex items-center mt-1">
          <span className="text-xs text-gray-500">Company: {company}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-xs text-gray-500">Applied: {date}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Reject
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          Approve
        </Button>
      </div>
    </div>
  )
}

// Component for document activity rows
function DocumentActivityRow({
  action,
  document,
  user,
  company,
  date,
  border = true,
}: {
  action: string
  document: string
  user: string
  company: string
  date: string
  border?: boolean
}) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "Uploaded":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Downloaded":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Edited":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "Shared":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "Deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <tr className={border ? "border-b" : ""}>
      <td className="p-3">
        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(action)}`}>{action}</span>
      </td>
      <td className="p-3">{document}</td>
      <td className="p-3">{user}</td>
      <td className="p-3">{company}</td>
      <td className="p-3">{date}</td>
    </tr>
  )
}

// Component for promotion cards
function PromotionCard({
  title,
  description,
  code,
  usageCount,
  startDate,
  endDate,
  status,
}: {
  title: string
  description: string
  code: string
  usageCount: number
  startDate: string
  endDate: string
  status: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
        <h4 className="font-medium mb-1 md:mb-0">{title}</h4>
        <div className="flex items-center">
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 text-xs rounded-full">
            {status}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>

      <div className="flex flex-wrap gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Promo Code</p>
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono text-sm">{code}</div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Usage</p>
          <p className="text-sm">{usageCount} redemptions</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Valid Period</p>
          <p className="text-sm">
            {startDate} - {endDate}
          </p>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="outline" size="sm">
          Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Deactivate
        </Button>
      </div>
    </div>
  )
}

