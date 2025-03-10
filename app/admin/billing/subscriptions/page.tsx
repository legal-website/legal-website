"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  BarChart2,
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
import { Switch } from "@/components/ui/switch"

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showPlanDialog, setShowPlanDialog] = useState(false)

  const subscriptionPlans = [
    {
      id: 1,
      name: "Basic",
      price: "$19.99",
      billingCycle: "monthly",
      features: ["LLC Formation", "Registered Agent (1 year)", "Basic Document Templates", "Email Support"],
      activeSubscribers: 342,
      growth: "+12.5%",
      trend: "up",
      revenue: "$6,836.58",
    },
    {
      id: 2,
      name: "Professional",
      price: "$39.99",
      billingCycle: "monthly",
      features: [
        "LLC Formation",
        "Registered Agent (1 year)",
        "Full Document Library",
        "Priority Support",
        "Annual Report Filing",
        "Business License Package",
      ],
      activeSubscribers: 587,
      growth: "+18.3%",
      trend: "up",
      revenue: "$23,474.13",
    },
    {
      id: 3,
      name: "Enterprise",
      price: "$99.99",
      billingCycle: "monthly",
      features: [
        "LLC Formation",
        "Registered Agent (1 year)",
        "Full Document Library",
        "24/7 Priority Support",
        "Annual Report Filing",
        "Business License Package",
        "Tax Preparation",
        "Compliance Monitoring",
        "Dedicated Account Manager",
      ],
      activeSubscribers: 156,
      growth: "+5.7%",
      trend: "up",
      revenue: "$15,598.44",
    },
    {
      id: 4,
      name: "Basic Annual",
      price: "$199.99",
      billingCycle: "annual",
      features: ["LLC Formation", "Registered Agent (1 year)", "Basic Document Templates", "Email Support"],
      activeSubscribers: 124,
      growth: "-2.1%",
      trend: "down",
      revenue: "$24,798.76",
    },
    {
      id: 5,
      name: "Professional Annual",
      price: "$399.99",
      billingCycle: "annual",
      features: [
        "LLC Formation",
        "Registered Agent (1 year)",
        "Full Document Library",
        "Priority Support",
        "Annual Report Filing",
        "Business License Package",
      ],
      activeSubscribers: 231,
      growth: "+8.2%",
      trend: "up",
      revenue: "$92,397.69",
    },
    {
      id: 6,
      name: "Enterprise Annual",
      price: "$999.99",
      billingCycle: "annual",
      features: [
        "LLC Formation",
        "Registered Agent (1 year)",
        "Full Document Library",
        "24/7 Priority Support",
        "Annual Report Filing",
        "Business License Package",
        "Tax Preparation",
        "Compliance Monitoring",
        "Dedicated Account Manager",
      ],
      activeSubscribers: 87,
      growth: "+15.2%",
      trend: "up",
      revenue: "$86,999.13",
    },
  ]

  const subscriptions = [
    {
      id: "SUB-2025-001",
      customer: "Rapid Ventures LLC",
      email: "billing@rapidventures.com",
      plan: "Enterprise Annual",
      price: "$999.99",
      startDate: "Mar 7, 2025",
      nextBillingDate: "Mar 7, 2026",
      status: "Active",
      paymentMethod: "Credit Card (Visa ending in 4242)",
    },
    {
      id: "SUB-2025-002",
      customer: "Blue Ocean Inc",
      email: "accounts@blueocean.com",
      plan: "Professional",
      price: "$39.99",
      startDate: "Feb 15, 2025",
      nextBillingDate: "Mar 15, 2025",
      status: "Active",
      paymentMethod: "Credit Card (Mastercard ending in 5678)",
    },
    {
      id: "SUB-2025-003",
      customer: "Summit Solutions",
      email: "finance@summitsolutions.com",
      plan: "Basic",
      price: "$19.99",
      startDate: "Jan 22, 2025",
      nextBillingDate: "Mar 22, 2025",
      status: "Past Due",
      paymentMethod: "ACH Transfer",
    },
    {
      id: "SUB-2025-004",
      customer: "Horizon Group",
      email: "ap@horizongroup.com",
      plan: "Professional Annual",
      price: "$399.99",
      startDate: "Dec 10, 2024",
      nextBillingDate: "Dec 10, 2025",
      status: "Active",
      paymentMethod: "Credit Card (Amex ending in 1234)",
    },
    {
      id: "SUB-2025-005",
      customer: "Quantum Solutions",
      email: "billing@quantumsolutions.com",
      plan: "Enterprise",
      price: "$99.99",
      startDate: "Mar 1, 2025",
      nextBillingDate: "Apr 1, 2025",
      status: "Active",
      paymentMethod: "PayPal",
    },
    {
      id: "SUB-2025-006",
      customer: "Apex Industries",
      email: "finance@apexind.com",
      plan: "Basic Annual",
      price: "$199.99",
      startDate: "Nov 5, 2024",
      nextBillingDate: "Nov 5, 2025",
      status: "Canceled",
      paymentMethod: "Credit Card (Visa ending in 9876)",
      cancellationDate: "Feb 28, 2025",
      cancellationReason: "Switched to competitor",
    },
    {
      id: "SUB-2025-007",
      customer: "Global Ventures",
      email: "accounts@globalventures.com",
      plan: "Professional",
      price: "$39.99",
      startDate: "Jan 15, 2025",
      nextBillingDate: "Mar 15, 2025",
      status: "Active",
      paymentMethod: "Credit Card (Mastercard ending in 4321)",
    },
  ]

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      subscription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.plan.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && subscription.status === "Active") ||
      (activeTab === "pastdue" && subscription.status === "Past Due") ||
      (activeTab === "canceled" && subscription.status === "Canceled") ||
      activeTab === "all"

    return matchesSearch && matchesTab
  })

  const handleEditPlan = (plan: (typeof subscriptionPlans)[0]) => {
    // Find the complete plan data from pricingData using the ID
    const planToEdit = subscriptionPlans.find((p) => p.id === plan.id)

    if (planToEdit) {
      // Set the complete plan data for editing
      //setEditingPlan({ ...planToEdit }) // Assuming setEditingPlan is defined elsewhere
      setShowPlanDialog(true)
    } else {
      // toast({
      //   title: "Error",
      //   description: "Could not find the plan to edit.",
      //   variant: "destructive",
      // })
      console.error("Could not find plan to edit")
    }
  }

  const handleDeletePlan = (planId: number) => {
    console.log("Deleting plan with ID:", planId)
  }

  const enhancedColumns = [
    {
      id: "edit",
      cell: ({ row }: { row: { original: (typeof subscriptionPlans)[0] } }) => {
        const plan = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and customer subscriptions</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowPlanDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Subscription Plans */}
      <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <SubscriptionPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Customer Subscriptions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-semibold">Customer Subscriptions</h2>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search subscriptions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Subscriptions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pastdue">Past Due</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Subscriptions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-sm">ID</th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th className="text-left p-4 font-medium text-sm">Plan</th>
                <th className="text-left p-4 font-medium text-sm">Price</th>
                <th className="text-left p-4 font-medium text-sm">Start Date</th>
                <th className="text-left p-4 font-medium text-sm">Next Billing</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b">
                  <td className="p-4">
                    <span className="font-mono text-sm">{subscription.id}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{subscription.customer}</p>
                      <p className="text-sm text-gray-500">{subscription.email}</p>
                    </div>
                  </td>
                  <td className="p-4">{subscription.plan}</td>
                  <td className="p-4 font-medium">{subscription.price}</td>
                  <td className="p-4 text-gray-500">{subscription.startDate}</td>
                  <td className="p-4 text-gray-500">{subscription.nextBillingDate}</td>
                  <td className="p-4">
                    <SubscriptionStatusBadge status={subscription.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Subscription Plan</DialogTitle>
            <DialogDescription>Define a new subscription plan for your customers.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-name" className="text-right">
                Plan Name
              </Label>
              <Input id="plan-name" placeholder="e.g. Professional Plus" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-price" className="text-right">
                Price
              </Label>
              <div className="col-span-3 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600">
                  $
                </span>
                <Input id="plan-price" placeholder="49.99" className="rounded-l-none" />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Billing Cycle</Label>
              <div className="col-span-3 flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="monthly" name="billing-cycle" className="h-4 w-4" defaultChecked />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="annual" name="billing-cycle" className="h-4 w-4" />
                  <Label htmlFor="annual">Annual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="custom" name="billing-cycle" className="h-4 w-4" />
                  <Label htmlFor="custom">Custom</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trial-days" className="text-right">
                Trial Period
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Input id="trial-days" placeholder="14" className="w-20" />
                <span>days</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Features</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input placeholder="e.g. LLC Formation" className="flex-1" />
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Input placeholder="e.g. Registered Agent (1 year)" className="flex-1" />
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Input placeholder="e.g. Document Templates" className="flex-1" />
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-status" className="text-right">
                Active
              </Label>
              <div className="col-span-3">
                <Switch id="plan-status" defaultChecked />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubscriptionPlanCard({ plan }: { plan: any }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-2xl font-bold mt-2">
              {plan.price}
              <span className="text-sm font-normal text-gray-500">
                /{plan.billingCycle === "monthly" ? "mo" : "yr"}
              </span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Subscribers</span>
            <div className={`flex items-center ${plan.trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {plan.trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span className="text-xs">{plan.growth}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">{plan.activeSubscribers}</span>
            <span className="text-sm text-gray-500">Revenue: {plan.revenue}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features:</h4>
          <ul className="space-y-1">
            {plan.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Active":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </span>
      )
    case "Past Due":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Past Due
        </span>
      )
    case "Canceled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <Trash2 className="h-3 w-3 mr-1" />
          Canceled
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      )
  }
}

