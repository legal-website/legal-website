"use client"

import { useState, useEffect } from "react"
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
  Save,
  X,
  RefreshCw,
  DollarSign,
  Users,
  Calendar,
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { usePricing } from "@/context/pricing-context"
import { PricingCards } from "@/components/pricing"
import type { Subscription, SubscriptionPlan, SubscriptionStats, PricingData } from "@/types/subscription"
import {
  getSubscriptions,
  getSubscriptionStats,
  cancelSubscription,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "@/lib/subscription-client"

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPricingEditor, setShowPricingEditor] = useState(false)
  const [showStateEditor, setShowStateEditor] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    canceledSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { pricingData, setPricingData, savePricingData, refreshPricingData } = usePricing()

  // Check authentication and admin role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/billing/subscriptions")
      return
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, session, router, currentPage, activeTab])

  // Fetch subscription data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get status filter based on active tab
      const statusFilter = activeTab !== "all" ? activeTab : undefined

      // Fetch subscriptions
      const { subscriptions: fetchedSubscriptions, total } = await getSubscriptions(
        currentPage,
        itemsPerPage,
        statusFilter,
      )

      setSubscriptions(fetchedSubscriptions)
      setTotalPages(Math.ceil(total / itemsPerPage))

      // Fetch subscription stats
      const fetchedStats = await getSubscriptionStats()
      setStats(fetchedStats)

      // Convert pricing plans to subscription plans format
      const pricingPlans = pricingData.plans.map((plan) => ({
        id: String(plan.id), // Convert id to string
        name: plan.name,
        price: Number(plan.price), // Ensure price is a number
        billingCycle: plan.billingCycle as "monthly" | "annual" | "one-time",
        features: plan.features,
        description: plan.description,
        isRecommended: plan.isRecommended,
        hasAssistBadge: plan.hasAssistBadge,
        includesPackage: plan.includesPackage,
        // Calculate these values from subscriptions data
        activeSubscribers: fetchedSubscriptions.filter((sub) => sub.planName === plan.name && sub.status === "active")
          .length,
        revenue: `$${fetchedSubscriptions
          .filter((sub) => sub.planName === plan.name)
          .reduce((sum, sub) => sum + sub.price, 0)
          .toFixed(2)}`,
        growth: "+0%", // This would need to be calculated from historical data
        trend: "up" as const,
      }))

      setSubscriptionPlans(pricingPlans)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "Failed to load subscription data")
      toast({
        title: "Error",
        description: `Failed to load subscription data: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter subscriptions based on search query
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    return (
      subscription.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.business?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.business?.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Handle editing a plan
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({
      ...plan,
      price: typeof plan.price === "string" ? plan.price : Number(plan.price).toString(),
      features: Array.isArray(plan.features) ? plan.features : [],
    })
    setIsEditing(true)
    setShowPlanDialog(true)
  }

  // Handle deleting a plan
  const handleDeletePlan = (planId: string) => {
    const planToDelete = subscriptionPlans.find((p) => p.id === planId)
    if (planToDelete) {
      setPlanToDelete(planToDelete)
      setShowDeleteDialog(true)
    }
  }

  // Delete a plan
  const deletePlan = async () => {
    if (!planToDelete) return

    try {
      setIsDeleting(true)

      // Delete the plan
      await deleteSubscriptionPlan(planToDelete.id)

      // Update pricing data
      const updatedPlans = pricingData.plans.filter((plan) => plan.id.toString() !== planToDelete.id)
      setPricingData({
        ...pricingData,
        plans: updatedPlans,
      })

      // Save pricing data
      await savePricingData()

      // Update local state
      setSubscriptionPlans((prev) => prev.filter((plan) => plan.id !== planToDelete.id))

      toast({
        title: "Plan deleted",
        description: `${planToDelete.name} plan has been deleted successfully.`,
      })

      // Close the dialog
      setShowDeleteDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setPlanToDelete(null)
    }
  }

  // Save pricing data changes
  const savePricingChanges = async () => {
    try {
      await savePricingData()

      toast({
        title: "Changes saved",
        description: "Pricing data has been updated successfully.",
      })

      // Refresh data
      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save pricing changes: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Fix the setPricingData function to use proper types
  const updatePricingPlan = (index: number, field: string, value: any) => {
    setPricingData((prev: PricingData) => {
      const updatedPlans = [...prev.plans]
      updatedPlans[index] = {
        ...updatedPlans[index],
        [field]: value,
      }
      return {
        ...prev,
        plans: updatedPlans,
      }
    })
  }

  // Update a state fee
  const updateStateFee = (state: string, value: number) => {
    setPricingData((prev: PricingData) => ({
      ...prev,
      stateFilingFees: {
        ...prev.stateFilingFees,
        [state]: value,
      },
    }))
  }

  // Update a state discount
  const updateStateDiscount = (state: string, value: number) => {
    setPricingData((prev: PricingData) => ({
      ...prev,
      stateDiscounts: {
        ...prev.stateDiscounts,
        [state]: value,
      },
    }))
  }

  // Update a state description
  const updateStateDescription = (state: string, value: string) => {
    setPricingData((prev: PricingData) => ({
      ...prev,
      stateDescriptions: {
        ...prev.stateDescriptions,
        [state]: value,
      },
    }))
  }

  // Handle subscription cancellation
  const handleCancelSubscription = (subscription: Subscription) => {
    setSubscriptionToCancel(subscription)
    setCancellationReason("")
    setShowCancelDialog(true)
  }

  // Cancel a subscription
  const confirmCancelSubscription = async () => {
    if (!subscriptionToCancel) return

    try {
      setIsCancelling(true)

      // Cancel the subscription
      await cancelSubscription(subscriptionToCancel.id, cancellationReason)

      // Update local state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionToCancel.id
            ? { ...sub, status: "canceled", cancellationReason, cancellationDate: new Date().toISOString() }
            : sub,
        ),
      )

      toast({
        title: "Subscription canceled",
        description: `The subscription for ${subscriptionToCancel.business?.name || "customer"} has been canceled.`,
      })

      // Close the dialog
      setShowCancelDialog(false)

      // Refresh data
      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to cancel subscription: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setSubscriptionToCancel(null)
    }
  }

  // Save or update a plan
  const saveSubscriptionPlan = async () => {
    if (!editingPlan) return

    try {
      // Prepare plan data
      const planData = {
        name: editingPlan.name,
        price: typeof editingPlan.price === "string" ? Number.parseFloat(editingPlan.price) : editingPlan.price,
        billingCycle: editingPlan.billingCycle,
        features: editingPlan.features.filter((f) => f.trim() !== ""),
        description: editingPlan.description || "",
        isRecommended: editingPlan.isRecommended || false,
        hasAssistBadge: editingPlan.hasAssistBadge || false,
        includesPackage: editingPlan.includesPackage || "",
      }

      if (isEditing) {
        // Update existing plan
        await updateSubscriptionPlan(editingPlan.id, planData)

        // Update pricing data
        const planIndex = pricingData.plans.findIndex((p) => String(p.id) === editingPlan.id)
        if (planIndex !== -1) {
          const updatedPlans = [...pricingData.plans]
          updatedPlans[planIndex] = {
            ...updatedPlans[planIndex],
            ...planData,
            id: updatedPlans[planIndex].id,
          }

          setPricingData({
            ...pricingData,
            plans: updatedPlans,
          })

          // Save pricing data
          await savePricingData()
        }

        toast({
          title: "Plan updated",
          description: `${editingPlan.name} plan has been updated successfully.`,
        })
      } else {
        // Create new plan
        const newPlan = await createSubscriptionPlan(planData)

        // Update pricing data
        setPricingData({
          ...pricingData,
          plans: [
            ...pricingData.plans,
            {
              ...planData,
              id: newPlan.id,
            },
          ],
        })

        // Save pricing data
        await savePricingData()

        toast({
          title: "Plan created",
          description: `${newPlan.name} plan has been created successfully.`,
        })
      }

      // Close the dialog and refresh data
      setShowPlanDialog(false)
      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} plan: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-white shadow-lg dark:bg-gray-800 max-w-md text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <CreditCard className="h-8 w-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Loading Subscriptions</h3>
            <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch your subscription data...</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h2 className="text-xl font-bold">Error Loading Subscriptions</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

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
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              setEditingPlan({
                id: "",
                name: "",
                price: "0", // Use string for price
                billingCycle: "monthly",
                features: [],
                description: "",
              })
              setIsEditing(false)
              setShowPlanDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <h3 className="text-2xl font-bold">{stats.activeSubscriptions}</h3>
              <p className="text-sm text-gray-500">Total: {stats.totalSubscriptions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</p>
              <h3 className="text-2xl font-bold">${stats.monthlyRecurringRevenue.toFixed(2)}</h3>
              <p className="text-sm text-gray-500">Annual: ${stats.annualRecurringRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</h3>
              <p className="text-sm text-gray-500">Lifetime value</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Plans */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold">Subscription Plans</h2>
        <div className="flex items-center space-x-3 mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => setShowPricingEditor(!showPricingEditor)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {showPricingEditor ? "Hide Pricing Editor" : "Edit Pricing Plans"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => setShowStateEditor(!showStateEditor)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {showStateEditor ? "Hide State Editor" : "Edit State Data"}
          </Button>
          <Button variant="outline" size="sm" className="flex items-center" onClick={refreshPricingData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Pricing Editor */}
      {showPricingEditor && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Pricing Plans</h3>
            <Button onClick={savePricingChanges} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            {pricingData.plans.map((plan, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`plan-name-${index}`}>Plan Name</Label>
                    <Input
                      id={`plan-name-${index}`}
                      value={plan.name}
                      onChange={(e) => updatePricingPlan(index, "name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`plan-price-${index}`}>Price</Label>
                    <Input
                      id={`plan-price-${index}`}
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePricingPlan(index, "price", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`plan-description-${index}`}>Description</Label>
                    <Input
                      id={`plan-description-${index}`}
                      value={plan.description}
                      onChange={(e) => updatePricingPlan(index, "description", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`plan-features-${index}`}>Features (one per line)</Label>
                    <Textarea
                      id={`plan-features-${index}`}
                      value={plan.features.join("\n")}
                      onChange={(e) => updatePricingPlan(index, "features", e.target.value.split("\n"))}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`plan-recommended-${index}`}
                      checked={plan.isRecommended || false}
                      onCheckedChange={(checked) => updatePricingPlan(index, "isRecommended", checked)}
                    />
                    <Label htmlFor={`plan-recommended-${index}`}>Recommended Plan</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* State Data Editor */}
      {showStateEditor && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit State Data</h3>
            <Button onClick={savePricingChanges} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <Label className="min-w-[150px]">State</Label>
              <Label className="min-w-[120px]">Filing Fee</Label>
              <Label className="min-w-[120px]">Discount</Label>
              <Label className="flex-1">Description</Label>
            </div>

            {Object.keys(pricingData.stateFilingFees)
              .sort()
              .map((state) => (
                <div key={state} className="flex items-start space-x-2">
                  <div className="min-w-[150px] pt-2">{state}</div>
                  <Input
                    type="number"
                    value={pricingData.stateFilingFees[state]}
                    onChange={(e) => updateStateFee(state, Number(e.target.value))}
                    className="min-w-[120px]"
                  />
                  <Input
                    type="number"
                    value={pricingData.stateDiscounts[state] || ""}
                    onChange={(e) => updateStateDiscount(state, Number(e.target.value))}
                    placeholder="No discount"
                    className="min-w-[120px]"
                  />
                  <Input
                    value={pricingData.stateDescriptions[state] || ""}
                    onChange={(e) => updateStateDescription(state, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Pricing Preview */}
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">Pricing Preview</h3>
          <p className="text-sm text-gray-500">This is how your pricing plans will appear to customers</p>
        </div>
        <div className="p-4">
          <PricingCards />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <SubscriptionPlanCard key={plan.id} plan={plan} onEdit={handleEditPlan} onDelete={handleDeletePlan} />
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
          <Button variant="outline" size="sm" className="flex items-center" onClick={() => setSearchQuery("")}>
            <Filter className="mr-2 h-4 w-4" />
            Clear Filter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Subscriptions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="past_due">Past Due</TabsTrigger>
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
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b">
                    <td className="p-4">
                      <span className="font-mono text-sm">{subscription.id.substring(0, 8)}...</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{subscription.business?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{subscription.business?.email || "No email"}</p>
                      </div>
                    </td>
                    <td className="p-4">{subscription.planName}</td>
                    <td className="p-4 font-medium">${subscription.price.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">{format(new Date(subscription.startDate), "MMM d, yyyy")}</td>
                    <td className="p-4 text-gray-500">
                      {format(new Date(subscription.nextBillingDate), "MMM d, yyyy")}
                    </td>
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
                        {subscription.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleCancelSubscription(subscription)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New/Edit Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? `Edit ${editingPlan?.name} Plan` : "Create New Subscription Plan"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the subscription plan details."
                : "Define a new subscription plan for your customers."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="plan-name"
                placeholder="e.g. Professional Plus"
                className="col-span-3"
                value={editingPlan?.name || ""}
                onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-price" className="text-right">
                Price
              </Label>
              <div className="col-span-3 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600">
                  $
                </span>
                <Input
                  id="plan-price"
                  placeholder="49.99"
                  className="rounded-l-none"
                  value={editingPlan?.price || ""}
                  onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, price: e.target.value } : null))}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Billing Cycle</Label>
              <div className="col-span-3 flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="monthly"
                    name="billing-cycle"
                    className="h-4 w-4"
                    checked={editingPlan?.billingCycle === "monthly"}
                    onChange={() => setEditingPlan((prev) => (prev ? { ...prev, billingCycle: "monthly" } : null))}
                  />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="annual"
                    name="billing-cycle"
                    className="h-4 w-4"
                    checked={editingPlan?.billingCycle === "annual"}
                    onChange={() => setEditingPlan((prev) => (prev ? { ...prev, billingCycle: "annual" } : null))}
                  />
                  <Label htmlFor="annual">Annual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="one-time"
                    name="billing-cycle"
                    className="h-4 w-4"
                    checked={editingPlan?.billingCycle === "one-time"}
                    onChange={() => setEditingPlan((prev) => (prev ? { ...prev, billingCycle: "one-time" } : null))}
                  />
                  <Label htmlFor="one-time">One-time</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-description" className="text-right">
                Description
              </Label>
              <Input
                id="plan-description"
                placeholder="Brief description of the plan"
                className="col-span-3"
                value={editingPlan?.description || ""}
                onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, description: e.target.value } : null))}
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Features</Label>
              <div className="col-span-3 space-y-2">
                {editingPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={feature}
                      className="flex-1"
                      onChange={(e) => {
                        if (editingPlan) {
                          const newFeatures = [...editingPlan.features]
                          newFeatures[index] = e.target.value
                          setEditingPlan({ ...editingPlan, features: newFeatures })
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (editingPlan) {
                          const newFeatures = editingPlan.features.filter((_, i) => i !== index)
                          setEditingPlan({ ...editingPlan, features: newFeatures })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (editingPlan) {
                      setEditingPlan({
                        ...editingPlan,
                        features: [...editingPlan.features, ""],
                      })
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-recommended" className="text-right">
                Recommended
              </Label>
              <div className="col-span-3">
                <Switch
                  id="plan-recommended"
                  checked={editingPlan?.isRecommended || false}
                  onCheckedChange={(checked) =>
                    setEditingPlan((prev) => (prev ? { ...prev, isRecommended: checked } : null))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={saveSubscriptionPlan}>
              {isEditing ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {planToDelete?.name} plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deletePlan()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the subscription for{" "}
              {subscriptionToCancel?.business?.name || "this customer"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="cancellation-reason">Cancellation Reason (optional)</Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please provide a reason for cancellation"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmCancelSubscription()
              }}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SubscriptionPlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (id: string) => void
}) {
  // Convert price to a number for display
  const displayPrice = typeof plan.price === "string" ? Number.parseFloat(plan.price).toFixed(2) : plan.price.toFixed(2)

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-2xl font-bold mt-2">
              ${displayPrice}
              <span className="text-sm font-normal text-gray-500">
                /{plan.billingCycle === "monthly" ? "mo" : plan.billingCycle === "annual" ? "yr" : "one-time"}
              </span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(plan.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Subscribers</span>
            {plan.trend && (
              <div className={`flex items-center ${plan.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {plan.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                <span className="text-xs">{plan.growth || "0%"}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">{plan.activeSubscribers || 0}</span>
            <span className="text-sm text-gray-500">Revenue: {plan.revenue || "$0.00"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features:</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
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

