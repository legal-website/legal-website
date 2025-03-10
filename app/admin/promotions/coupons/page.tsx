"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Filter, Edit, Trash2, Copy, BarChart3, Calendar, Tag, Percent, CheckCircle2, XCircle, Clock } from 'lucide-react'
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

// Define interfaces for type safety
interface Coupon {
  id: number
  code: string
  description: string
  type: string
  value: string
  startDate: string
  endDate: string
  usageCount: number
  usageLimit: number
  status: "Active" | "Scheduled" | "Expired"
}

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  const coupons: Coupon[] = [
    {
      id: 1,
      code: "SPRING25",
      description: "25% off all business formation packages",
      type: "Percentage",
      value: "25%",
      startDate: "Mar 1, 2025",
      endDate: "Mar 31, 2025",
      usageCount: 142,
      usageLimit: 500,
      status: "Active",
    },
    {
      id: 2,
      code: "COMPLY199",
      description: "Get annual report filing and registered agent service for $199",
      type: "Fixed Amount",
      value: "$199",
      startDate: "Feb 15, 2025",
      endDate: "Apr 15, 2025",
      usageCount: 87,
      usageLimit: 300,
      status: "Active",
    },
    {
      id: 3,
      code: "REFER50",
      description: "Refer a friend and both get $50 credit",
      type: "Fixed Amount",
      value: "$50",
      startDate: "Jan 1, 2025",
      endDate: "Dec 31, 2025",
      usageCount: 215,
      usageLimit: 1000,
      status: "Active",
    },
    {
      id: 4,
      code: "TAXFREE",
      description: "Free tax consultation with any business package",
      type: "Service",
      value: "Free Consultation",
      startDate: "Feb 1, 2025",
      endDate: "Apr 15, 2025",
      usageCount: 63,
      usageLimit: 200,
      status: "Active",
    },
    {
      id: 5,
      code: "SUMMER20",
      description: "20% off all services for summer",
      type: "Percentage",
      value: "20%",
      startDate: "Jun 1, 2025",
      endDate: "Aug 31, 2025",
      usageCount: 0,
      usageLimit: 500,
      status: "Scheduled",
    },
    {
      id: 6,
      code: "WELCOME15",
      description: "15% off first order for new customers",
      type: "Percentage",
      value: "15%",
      startDate: "Jan 1, 2025",
      endDate: "Dec 31, 2025",
      usageCount: 328,
      usageLimit: 1000,
      status: "Active",
    },
    {
      id: 7,
      code: "HOLIDAY50",
      description: "50% off holiday special",
      type: "Percentage",
      value: "50%",
      startDate: "Dec 1, 2024",
      endDate: "Dec 31, 2024",
      usageCount: 412,
      usageLimit: 500,
      status: "Expired",
    },
  ]
  
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = 
      (activeTab === "active" && coupon.status === "Active") ||
      (activeTab === "scheduled" && coupon.status === "Scheduled") ||
      (activeTab === "expired" && coupon.status === "Expired") ||
      activeTab === "all"
    
    return matchesSearch && matchesTab
  })
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage discount coupons for your clients
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coupons..."
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
            <option>Most Used</option>
            <option>Recently Created</option>
            <option>Expiring Soon</option>
            <option>Alphabetical</option>
          </select>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Coupons</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Coupons List */}
      <div className="space-y-4">
        {filteredCoupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>
      
      {/* Create Coupon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount coupon for your clients.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Coupon Code
              </Label>
              <Input id="code" placeholder="e.g. SUMMER25" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of this coupon"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Discount Type
              </Label>
              <select
                id="type"
                className="col-span-3 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount</option>
                <option value="service">Free Service</option>
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Discount Value
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
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input id="startDate" type="date" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input id="endDate" type="date" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usageLimit" className="text-right">
                Usage Limit
              </Label>
              <Input id="usageLimit" type="number" placeholder="e.g. 500" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Restrictions
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="newCustomers" className="mr-2" />
                  <label htmlFor="newCustomers" className="text-sm">New customers only</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="onePerCustomer" className="mr-2" />
                  <label htmlFor="onePerCustomer" className="text-sm">One use per customer</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="minimumOrder" className="mr-2" />
                  <label htmlFor="minimumOrder" className="text-sm">Minimum order value</label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const getStatusColor = (status: "Active" | "Scheduled" | "Expired") => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }
  
  const getStatusIcon = (status: "Active" | "Scheduled" | "Expired") => {
    switch (status) {
      case 'Active':
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case 'Scheduled':
        return <Clock className="h-4 w-4 mr-1" />
      case 'Expired':
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }
  
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center mb-1">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded mr-3">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{coupon.code}</h3>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center ${getStatusColor(coupon.status)}`}>
                  {getStatusIcon(coupon.status)}
                  {coupon.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{coupon.description}</p>
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
          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Discount</p>
          <div className="flex items-center">
            <Percent className="h-4 w-4 mr-1 text-gray-400" />
            <span>{coupon.value} {coupon.type}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Valid Period</p>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            <span>{coupon.startDate} - {coupon.endDate}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Usage</p>
          <div className="flex items-center">
            <span>{coupon.usageCount} / {coupon.usageLimit}</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
          <div className="flex items-center">
            <span>{Math.floor(Math.random() * 30) + 10}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
