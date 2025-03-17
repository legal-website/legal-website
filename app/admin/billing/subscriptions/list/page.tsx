"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Edit, Trash2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Subscription {
  id: string
  planId: string
  planName: string
  price: number
  billingCycle: string
  status: string
  startDate: string
  nextBillingDate: string
  businessId: string
  business?: {
    id: string
    name: string
    email: string
  }
}

interface SubscriptionsResponse {
  subscriptions: Subscription[]
  total: number
}

export default function SubscriptionsList() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [page, setPage] = useState(1)
  const [totalSubscriptions, setTotalSubscriptions] = useState(0)
  const [pricingData, setPricingData] = useState<any>({ plans: [] })

  // Fetch subscriptions from the API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/subscriptions?page=${page}&limit=10`)

        if (!response.ok) {
          throw new Error("Failed to fetch subscriptions")
        }

        const data: SubscriptionsResponse = await response.json()
        setSubscriptions(data.subscriptions)
        setTotalSubscriptions(data.total)
        setError(null)
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
        setError("Failed to load subscriptions. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [page])

  // Fetch pricing data for the plan dropdown
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const response = await fetch("/api/pricing")

        if (!response.ok) {
          throw new Error("Failed to fetch pricing data")
        }

        const data = await response.json()
        setPricingData(data)
      } catch (error) {
        console.error("Error fetching pricing data:", error)
      }
    }

    fetchPricingData()
  }, [])

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      subscription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subscription.business?.name || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && subscription.status === "active") ||
      (activeTab === "pastdue" && subscription.status === "past_due") ||
      (activeTab === "canceled" && subscription.status === "canceled") ||
      activeTab === "all"

    return matchesSearch && matchesTab
  })

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setShowEditDialog(true)
  }

  const handleSaveSubscription = async () => {
    if (!editingSubscription) return

    try {
      const response = await fetch(`/api/subscriptions/${editingSubscription.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: editingSubscription.planId,
          planName: editingSubscription.planName,
          price: editingSubscription.price,
          billingCycle: editingSubscription.billingCycle,
          status: editingSubscription.status,
          nextBillingDate: new Date(editingSubscription.nextBillingDate),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update subscription")
      }

      // Update the subscription in the local state
      setSubscriptions(subscriptions.map((sub) => (sub.id === editingSubscription.id ? editingSubscription : sub)))

      setShowEditDialog(false)
      setEditingSubscription(null)

      toast({
        title: "Success",
        description: "Subscription updated successfully.",
      })
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show loading state
  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

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
                    <span className="font-mono text-sm">{subscription.id.substring(0, 8)}...</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{subscription.business?.name || "Unknown Business"}</p>
                      <p className="text-sm text-gray-500">{subscription.business?.email || "No email"}</p>
                    </div>
                  </td>
                  <td className="p-4">{subscription.planName}</td>
                  <td className="p-4 font-medium">${subscription.price}</td>
                  <td className="p-4 text-gray-500">{new Date(subscription.startDate).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-500">{new Date(subscription.nextBillingDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <SubscriptionStatusBadge status={subscription.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSubscription(subscription)}>
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

        {/* Pagination */}
        {totalSubscriptions > 10 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalSubscriptions)} of {totalSubscriptions}{" "}
              subscriptions
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 10 >= totalSubscriptions}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>Update the details of this subscription.</DialogDescription>
          </DialogHeader>

          {editingSubscription && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-plan" className="text-right">
                  Plan
                </Label>
                <div className="col-span-3">
                  <Select
                    value={editingSubscription.planId.toString()}
                    onValueChange={(value) => {
                      const selectedPlan = pricingData.plans.find((p: any) => p.id.toString() === value)
                      if (selectedPlan) {
                        setEditingSubscription({
                          ...editingSubscription,
                          planId: value,
                          planName: selectedPlan.name,
                          price: selectedPlan.price,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingData.plans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - ${plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-price" className="text-right">
                  Price
                </Label>
                <div className="col-span-3 flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600">
                    $
                  </span>
                  <Input
                    id="subscription-price"
                    type="number"
                    value={editingSubscription.price}
                    onChange={(e) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        price: Number.parseFloat(e.target.value),
                      })
                    }
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-status" className="text-right">
                  Status
                </Label>
                <div className="col-span-3">
                  <Select
                    value={editingSubscription.status}
                    onValueChange={(value) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-billing-cycle" className="text-right">
                  Billing Cycle
                </Label>
                <div className="col-span-3">
                  <Select
                    value={editingSubscription.billingCycle}
                    onValueChange={(value) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        billingCycle: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-next-billing" className="text-right">
                  Next Billing Date
                </Label>
                <div className="col-span-3">
                  <Input
                    id="subscription-next-billing"
                    type="date"
                    value={new Date(editingSubscription.nextBillingDate).toISOString().split("T")[0]}
                    onChange={(e) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        nextBillingDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveSubscription}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </span>
      )
    case "past_due":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Past Due
        </span>
      )
    case "canceled":
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

