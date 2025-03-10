"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Calendar,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

// Define types for our deal data
type DealStatus = "Active" | "Scheduled" | "Expired"
type DealType = "Discount" | "Bundle" | "Referral" | "Free Service"

interface Deal {
  id: number
  title: string
  description: string
  type: DealType
  value: string
  startDate: string
  endDate: string
  target: string
  conversions: number
  views: number
  revenue: string
  status: DealStatus
}

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const deals: Deal[] = [
    {
      id: 1,
      title: "Spring Business Setup Special",
      description: "25% off all business formation packages",
      type: "Discount",
      value: "25%",
      startDate: "Mar 1, 2025",
      endDate: "Mar 31, 2025",
      target: "All Customers",
      conversions: 142,
      views: 876,
      revenue: "$28,400",
      status: "Active",
    },
    {
      id: 2,
      title: "Compliance Bundle",
      description: "Get annual report filing and registered agent service for $199",
      type: "Bundle",
      value: "$199",
      startDate: "Feb 15, 2025",
      endDate: "Apr 15, 2025",
      target: "Existing Customers",
      conversions: 87,
      views: 543,
      revenue: "$17,313",
      status: "Active",
    },
    {
      id: 3,
      title: "Referral Bonus",
      description: "Refer a friend and both get $50 credit",
      type: "Referral",
      value: "$50",
      startDate: "Jan 1, 2025",
      endDate: "Dec 31, 2025",
      target: "All Customers",
      conversions: 215,
      views: 1240,
      revenue: "$32,250",
      status: "Active",
    },
    {
      id: 4,
      title: "Tax Season Special",
      description: "Free tax consultation with any business package",
      type: "Free Service",
      value: "Free Consultation",
      startDate: "Feb 1, 2025",
      endDate: "Apr 15, 2025",
      target: "New Customers",
      conversions: 63,
      views: 420,
      revenue: "$12,600",
      status: "Active",
    },
    {
      id: 5,
      title: "Summer Business Boost",
      description: "20% off all services for summer",
      type: "Discount",
      value: "20%",
      startDate: "Jun 1, 2025",
      endDate: "Aug 31, 2025",
      target: "All Customers",
      conversions: 0,
      views: 0,
      revenue: "$0",
      status: "Scheduled",
    },
    {
      id: 6,
      title: "Black Friday Special",
      description: "50% off all premium services",
      type: "Discount",
      value: "50%",
      startDate: "Nov 25, 2025",
      endDate: "Nov 30, 2025",
      target: "All Customers",
      conversions: 0,
      views: 0,
      revenue: "$0",
      status: "Scheduled",
    },
    {
      id: 7,
      title: "Holiday Bundle",
      description: "Complete business setup package at 30% off",
      type: "Bundle",
      value: "30% off",
      startDate: "Dec 1, 2024",
      endDate: "Dec 31, 2024",
      target: "New Customers",
      conversions: 98,
      views: 645,
      revenue: "$24,500",
      status: "Expired",
    },
  ]

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && deal.status === "Active") ||
      (activeTab === "scheduled" && deal.status === "Scheduled") ||
      (activeTab === "expired" && deal.status === "Expired") ||
      activeTab === "all"

    return matchesSearch && matchesTab
  })

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deals Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage special offers and deals for your clients
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Deals Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Active Deals</span>
                <span className="text-sm font-medium">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Conversions</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">507</span>
                  <div className="flex items-center text-green-500">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">12%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Revenue</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">$90,563</span>
                  <div className="flex items-center text-green-500">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">8%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">16.3%</span>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span className="text-xs">2.1%</span>
                </div>
              </div>
              <Progress value={16.3} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Average Deal Value</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">$178.62</span>
                <div className="flex items-center text-red-500">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  <span className="text-xs">3.5%</span>
                </div>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Top Performing Deal</p>
              <p className="text-sm font-medium">Referral Bonus</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">215 conversions</span>
                <span className="text-xs text-gray-500">$32,250 revenue</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search deals..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="flex-1">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <option>Most Conversions</option>
            <option>Highest Revenue</option>
            <option>Recently Created</option>
            <option>Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Deals</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>Create a new special offer or deal for your clients.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Deal Title
              </Label>
              <Input id="title" placeholder="e.g. Spring Business Special" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" placeholder="Brief description of this deal" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Deal Type
              </Label>
              <select
                id="type"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="discount">Percentage Discount</option>
                <option value="fixed">Fixed Price</option>
                <option value="bundle">Bundle</option>
                <option value="free">Free Service</option>
                <option value="referral">Referral Program</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Deal Value
              </Label>
              <div className="col-span-3 flex items-center">
                <Input id="value" placeholder="e.g. 25" className="flex-1" />
                <select className="ml-2 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option>%</option>
                  <option>$</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Valid Period</Label>
              <div className="col-span-3 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm text-gray-500">
                    Start Date
                  </Label>
                  <Input id="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm text-gray-500">
                    End Date
                  </Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">
                Target Audience
              </Label>
              <select
                id="target"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="all">All Customers</option>
                <option value="new">New Customers Only</option>
                <option value="existing">Existing Customers Only</option>
                <option value="segment">Customer Segment</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Applicable Services</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="formation" className="mr-2" defaultChecked />
                  <label htmlFor="formation" className="text-sm">
                    Business Formation
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="compliance" className="mr-2" defaultChecked />
                  <label htmlFor="compliance" className="text-sm">
                    Compliance Services
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="tax" className="mr-2" defaultChecked />
                  <label htmlFor="tax" className="text-sm">
                    Tax Services
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="legal" className="mr-2" />
                  <label htmlFor="legal" className="text-sm">
                    Legal Services
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Promotion Channels</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="website" className="mr-2" defaultChecked />
                  <label htmlFor="website" className="text-sm">
                    Website Banner
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="email" className="mr-2" defaultChecked />
                  <label htmlFor="email" className="text-sm">
                    Email Campaign
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="dashboard" className="mr-2" defaultChecked />
                  <label htmlFor="dashboard" className="text-sm">
                    Client Dashboard
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="social" className="mr-2" />
                  <label htmlFor="social" className="text-sm">
                    Social Media
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limit" className="text-right">
                Usage Limit
              </Label>
              <Input id="limit" type="number" placeholder="Leave blank for unlimited" className="col-span-3" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DealCardProps {
  deal: Deal
}

function DealCard({ deal }: DealCardProps) {
  const getStatusColor = (status: DealStatus): string => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: DealStatus) => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "Scheduled":
        return <Clock className="h-4 w-4 mr-1" />
      case "Expired":
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  const getTypeIcon = (type: DealType) => {
    switch (type) {
      case "Discount":
        return <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case "Bundle":
        return <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case "Referral":
        return <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case "Free Service":
        return <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    }
  }

  // Calculate conversion rate
  const conversionRate = deal.views > 0 ? ((deal.conversions / deal.views) * 100).toFixed(1) : 0

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center mb-1">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded mr-3">{getTypeIcon(deal.type)}</div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{deal.title}</h3>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center ${getStatusColor(deal.status)}`}
                >
                  {getStatusIcon(deal.status)}
                  {deal.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{deal.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Deal Value</p>
          <div className="flex items-center">
            <span>{deal.value}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Valid Period</p>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-sm">
              {deal.startDate} - {deal.endDate}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Target</p>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-sm">{deal.target}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Conversions</p>
          <div className="flex items-center">
            <span className="text-sm font-medium">{deal.conversions}</span>
            {deal.status === "Active" && <span className="ml-2 text-xs text-green-600">+12 today</span>}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
          <div className="flex items-center">
            <span className="text-sm font-medium">{conversionRate}%</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Revenue</p>
          <div className="flex items-center">
            <span className="text-sm font-medium">{deal.revenue}</span>
            {deal.status === "Active" && <span className="ml-2 text-xs text-green-600">+$1,250 today</span>}
          </div>
        </div>
      </div>
    </Card>
  )
}

