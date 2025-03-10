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
  CheckCircle2,
  Clock,
  Users,
  Layers,
  ArrowUpRight,
  Mail,
  Globe,
  MessageSquare,
  Share2,
  Megaphone,
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

// Define types for campaign data structure
interface CampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  revenue: string
  roi: string
}

interface Campaign {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  status: "Active" | "Scheduled" | "Completed"
  channels: string[]
  audience: string
  deals: string[]
  metrics: CampaignMetrics
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const campaigns: Campaign[] = [
    {
      id: 1,
      name: "Spring Business Launch",
      description: "Comprehensive campaign for spring business formation",
      startDate: "Mar 1, 2025",
      endDate: "Mar 31, 2025",
      status: "Active",
      channels: ["Email", "Social Media", "Website", "Client Dashboard"],
      audience: "All Prospects",
      deals: ["Spring Business Setup Special", "Referral Bonus"],
      metrics: {
        impressions: 12450,
        clicks: 2340,
        conversions: 187,
        revenue: "$37,400",
        roi: "320%",
      },
    },
    {
      id: 2,
      name: "Tax Season Readiness",
      description: "Campaign focused on tax preparation services",
      startDate: "Feb 1, 2025",
      endDate: "Apr 15, 2025",
      status: "Active",
      channels: ["Email", "Client Dashboard", "Direct Mail"],
      audience: "Existing Clients",
      deals: ["Tax Season Special", "Compliance Bundle"],
      metrics: {
        impressions: 8750,
        clicks: 1560,
        conversions: 132,
        revenue: "$26,400",
        roi: "280%",
      },
    },
    {
      id: 3,
      name: "Referral Program Boost",
      description: "Campaign to increase client referrals",
      startDate: "Jan 15, 2025",
      endDate: "Jun 30, 2025",
      status: "Active",
      channels: ["Email", "Social Media", "Client Dashboard"],
      audience: "Existing Clients",
      deals: ["Referral Bonus"],
      metrics: {
        impressions: 6320,
        clicks: 980,
        conversions: 95,
        revenue: "$19,000",
        roi: "350%",
      },
    },
    {
      id: 4,
      name: "Summer Business Growth",
      description: "Campaign for summer business expansion services",
      startDate: "Jun 1, 2025",
      endDate: "Aug 31, 2025",
      status: "Scheduled",
      channels: ["Email", "Social Media", "Website", "Webinars"],
      audience: "All Customers",
      deals: ["Summer Business Boost"],
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: "$0",
        roi: "0%",
      },
    },
    {
      id: 5,
      name: "Black Friday & Holiday Special",
      description: "End of year promotion for business services",
      startDate: "Nov 25, 2025",
      endDate: "Dec 31, 2025",
      status: "Scheduled",
      channels: ["Email", "Social Media", "Website", "Client Dashboard", "Direct Mail"],
      audience: "All Customers and Prospects",
      deals: ["Black Friday Special", "Holiday Bundle"],
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: "$0",
        roi: "0%",
      },
    },
    {
      id: 6,
      name: "New Year Business Planning",
      description: "Campaign for business planning and formation services",
      startDate: "Dec 15, 2024",
      endDate: "Jan 31, 2025",
      status: "Completed",
      channels: ["Email", "Social Media", "Website", "Webinars"],
      audience: "All Prospects",
      deals: ["Holiday Bundle"],
      metrics: {
        impressions: 15680,
        clicks: 3240,
        conversions: 245,
        revenue: "$49,000",
        roi: "410%",
      },
    },
  ]

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && campaign.status === "Active") ||
      (activeTab === "scheduled" && campaign.status === "Scheduled") ||
      (activeTab === "completed" && campaign.status === "Completed") ||
      activeTab === "all"

    return matchesSearch && matchesTab
  })

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage multi-channel marketing campaigns</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Campaign Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Campaigns</span>
                <span className="text-sm font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Impressions</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">27,520</span>
                  <div className="flex items-center text-green-500">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">15%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Conversions</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">414</span>
                  <div className="flex items-center text-green-500">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">12%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Revenue</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">$82,800</span>
                  <div className="flex items-center text-green-500">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">18%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">8.5%</span>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span className="text-xs">1.2%</span>
                </div>
              </div>
              <Progress value={8.5} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Average ROI</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">316%</span>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span className="text-xs">5%</span>
                </div>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-1">Top Performing Campaign</p>
              <p className="text-sm font-medium">Spring Business Launch</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">187 conversions</span>
                <span className="text-xs text-gray-500">$37,400 revenue</span>
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
            placeholder="Search campaigns..."
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
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>Create a new marketing campaign across multiple channels.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Campaign Name
              </Label>
              <Input id="name" placeholder="e.g. Summer Business Growth" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" placeholder="Brief description of this campaign" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Campaign Period</Label>
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
              <Label htmlFor="audience" className="text-right">
                Target Audience
              </Label>
              <select
                id="audience"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="all">All Customers and Prospects</option>
                <option value="customers">Existing Customers Only</option>
                <option value="prospects">Prospects Only</option>
                <option value="segment">Custom Segment</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Marketing Channels</Label>
              <div className="col-span-3 grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <input type="checkbox" id="email" className="mr-2" defaultChecked />
                  <label htmlFor="email" className="text-sm">
                    Email Marketing
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="social" className="mr-2" defaultChecked />
                  <label htmlFor="social" className="text-sm">
                    Social Media
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="website" className="mr-2" defaultChecked />
                  <label htmlFor="website" className="text-sm">
                    Website
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="dashboard" className="mr-2" defaultChecked />
                  <label htmlFor="dashboard" className="text-sm">
                    Client Dashboard
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="direct" className="mr-2" />
                  <label htmlFor="direct" className="text-sm">
                    Direct Mail
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="webinar" className="mr-2" />
                  <label htmlFor="webinar" className="text-sm">
                    Webinars
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Associated Deals</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="deal1" className="mr-2" defaultChecked />
                  <label htmlFor="deal1" className="text-sm">
                    Summer Business Boost
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="deal2" className="mr-2" />
                  <label htmlFor="deal2" className="text-sm">
                    Referral Bonus
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="deal3" className="mr-2" />
                  <label htmlFor="deal3" className="text-sm">
                    Compliance Bundle
                  </label>
                </div>
                <div className="flex items-center text-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm cursor-pointer">Create New Deal</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Campaign Goals</Label>
              <div className="col-span-3 space-y-3">
                <div>
                  <Label htmlFor="impressions" className="text-sm text-gray-500">
                    Target Impressions
                  </Label>
                  <Input id="impressions" type="number" placeholder="e.g. 10000" />
                </div>
                <div>
                  <Label htmlFor="conversions" className="text-sm text-gray-500">
                    Target Conversions
                  </Label>
                  <Input id="conversions" type="number" placeholder="e.g. 200" />
                </div>
                <div>
                  <Label htmlFor="revenue" className="text-sm text-gray-500">
                    Target Revenue
                  </Label>
                  <Input id="revenue" type="text" placeholder="e.g. $40,000" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CampaignCardProps {
  campaign: Campaign
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "Scheduled":
        return <Clock className="h-4 w-4 mr-1" />
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  // Calculate click-through rate
  const ctr =
    campaign.metrics.impressions > 0 ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(1) : 0

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center mb-1">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded mr-3">
              <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{campaign.name}</h3>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center ${getStatusColor(campaign.status)}`}
                >
                  {getStatusIcon(campaign.status)}
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{campaign.description}</p>
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

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-500">
                Campaign Period: {campaign.startDate} - {campaign.endDate}
              </span>
            </div>
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-500">Target Audience: {campaign.audience}</span>
            </div>
            <div className="flex items-start mb-2">
              <Tag className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="text-sm text-gray-500">Associated Deals: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.deals.map((deal, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                    >
                      {deal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start mb-2">
              <Share2 className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="text-sm text-gray-500">Marketing Channels: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.channels.map((channel, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex items-center"
                    >
                      {getChannelIcon(channel)}
                      {channel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {campaign.status !== "Scheduled" && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Impressions</p>
                <p className="text-sm font-medium">{campaign.metrics.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Clicks</p>
                <div className="flex items-center">
                  <p className="text-sm font-medium mr-2">{campaign.metrics.clicks.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">({ctr}% CTR)</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Conversions</p>
                <p className="text-sm font-medium">{campaign.metrics.conversions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-sm font-medium">{campaign.metrics.revenue}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ROI</p>
                <p className="text-sm font-medium">{campaign.metrics.roi}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "Email":
      return <Mail className="h-3 w-3 mr-1" />
    case "Social Media":
      return <MessageSquare className="h-3 w-3 mr-1" />
    case "Website":
      return <Globe className="h-3 w-3 mr-1" />
    case "Client Dashboard":
      return <Layers className="h-3 w-3 mr-1" />
    case "Direct Mail":
      return <Mail className="h-3 w-3 mr-1" />
    case "Webinars":
      return <Users className="h-3 w-3 mr-1" />
    default:
      return null
  }
}

