"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

// Import the usePricing hook
import { usePricing } from "@/context/pricing-context"

// Define types for our data
interface PricingPlan {
  id: number
  name: string
  price: number
  displayPrice: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended?: boolean
  includesPackage?: string
  hasAssistBadge?: boolean
}

interface StateFilingFees {
  [state: string]: number
}

interface StateDiscounts {
  [state: string]: number
}

interface StateDescriptions {
  [state: string]: string
}

interface PricingData {
  plans: PricingPlan[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
}

// Define types for customer subscriptions
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
  templateId?: string
  type?: string
}

interface CustomerSubscription {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: string
  items: InvoiceItem[] | string
  paymentDate?: string
  createdAt: string
  packageName: string
}

export default function SubscriptionsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("plans")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null)
  const [editingState, setEditingState] = useState<string | null>(null)
  const [newFeature, setNewFeature] = useState("")
  const [customerSubscriptions, setCustomerSubscriptions] = useState<CustomerSubscription[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [selectedSubscription, setSelectedSubscription] = useState<CustomerSubscription | null>(null)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  // Add these pagination state variables after the other state declarations (around line 70)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // State for pricing data
  const {
    pricingData,
    loading: contextLoading,
    error: contextError,
    refreshPricingData,
    updatePricingData,
  } = usePricing()

  // State for edited state fees
  const [editedStateFee, setEditedStateFee] = useState<number | string>("")
  const [editedStateDiscount, setEditedStateDiscount] = useState<number | string>("")
  const [editedStateDescription, setEditedStateDescription] = useState("")

  // Fetch pricing data from the API
  const fetchPricingData = async () => {
    try {
      setLoading(true)
      await refreshPricingData()
      setError(null)
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setError("Failed to load pricing information. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Update the fetchCustomerSubscriptions function to filter out invoices starting with "temp"
  // Find the existing fetchCustomerSubscriptions function and modify it:

  // Fetch customer subscriptions
  const fetchCustomerSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true)
      setSubscriptionError(null)

      const response = await fetch("/api/admin/invoices", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.status}`)
      }

      const data = await response.json()

      if (!data.invoices) {
        throw new Error("Invalid response format")
      }

      // Process the invoices to create subscription data
      const subscriptions = data.invoices
        .filter((invoice: any) => invoice.status === "paid" && !invoice.invoiceNumber.toLowerCase().startsWith("temp")) // Filter out temp invoices
        .map((invoice: any) => {
          // Parse items if they're stored as a JSON string
          let parsedItems = invoice.items
          try {
            if (typeof invoice.items === "string") {
              parsedItems = JSON.parse(invoice.items)
            }
          } catch (e) {
            console.error(`Error parsing items for invoice ${invoice.id}:`, e)
            parsedItems = []
          }

          // Extract package name from items
          let packageName = "Unknown Package"
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            packageName = parsedItems[0].tier || "Unknown Package"
          } else if (typeof parsedItems === "object" && parsedItems !== null) {
            packageName = parsedItems.tier || "Unknown Package"
          }

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            amount: invoice.amount,
            status: invoice.status,
            items: parsedItems,
            paymentDate: invoice.paymentDate || invoice.updatedAt,
            createdAt: invoice.createdAt,
            packageName,
          }
        })

      setCustomerSubscriptions(subscriptions)
      // Reset to first page when fetching new data
      setCurrentPage(1)
    } catch (error: any) {
      console.error("Error fetching customer subscriptions:", error)
      setSubscriptionError(error.message || "Failed to load customer subscriptions")
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
    fetchCustomerSubscriptions()
  }, [])

  // Save pricing data to the API
  const savePricingData = async () => {
    try {
      setSaving(true)
      setError(null)

      console.log("Saving pricing data...", pricingData)
      const success = await updatePricingData(pricingData)

      if (success) {
        toast({
          title: "Success",
          description: "Pricing data has been saved successfully.",
        })
      } else {
        throw new Error("Failed to save pricing data")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error saving pricing data:", errorMessage)
      setError(`Failed to save pricing data: ${errorMessage}`)
      toast({
        title: "Error",
        description: "Failed to save pricing data. Please check the console for details.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle editing a plan
  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan({
      ...plan,
      features: [...plan.features], // Create a copy of the features array
    })
    setShowPlanDialog(true)
  }

  // Handle deleting a plan
  const handleDeletePlan = (planId: number) => {
    setDeletingPlanId(planId)
    setShowDeleteDialog(true)
  }

  // Confirm plan deletion
  const confirmDeletePlan = () => {
    if (deletingPlanId !== null) {
      const updatedPlans = pricingData.plans.filter((plan) => plan.id !== deletingPlanId)
      const updatedPricingData = {
        ...pricingData,
        plans: updatedPlans,
      }
      updatePricingData(updatedPricingData)

      toast({
        title: "Plan Deleted",
        description: "The subscription plan has been deleted.",
      })

      setShowDeleteDialog(false)
      setDeletingPlanId(null)

      // Save changes to the API
      savePricingData()
    }
  }

  // Handle saving a plan
  const handleSavePlan = () => {
    if (!editingPlan) return

    let updatedPlans: PricingPlan[]

    if (editingPlan.id) {
      // Update existing plan
      updatedPlans = pricingData.plans.map((plan) => (plan.id === editingPlan.id ? editingPlan : plan))
    } else {
      // Add new plan with a new ID
      const newId = Math.max(0, ...pricingData.plans.map((plan) => plan.id)) + 1
      updatedPlans = [
        ...pricingData.plans,
        {
          ...editingPlan,
          id: newId,
        },
      ]
    }

    const updatedPricingData = {
      ...pricingData,
      plans: updatedPlans,
    }
    updatePricingData(updatedPricingData)

    setShowPlanDialog(false)
    setEditingPlan(null)

    // Save changes to the API
    savePricingData()

    toast({
      title: "Success",
      description: `Plan ${editingPlan.id ? "updated" : "created"} successfully.`,
    })
  }

  // Handle adding a new plan
  const handleAddPlan = () => {
    setEditingPlan({
      id: 0, // Will be replaced with a new ID when saved
      name: "",
      price: 0,
      displayPrice: "$0",
      billingCycle: "one-time",
      description: "",
      features: [],
      isRecommended: false,
      includesPackage: "",
      hasAssistBadge: false,
    })
    setShowPlanDialog(true)
  }

  // Handle adding a feature to a plan
  const handleAddFeature = () => {
    if (!editingPlan || !newFeature.trim()) return

    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()],
    })

    setNewFeature("")
  }

  // Handle removing a feature from a plan
  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return

    const updatedFeatures = [...editingPlan.features]
    updatedFeatures.splice(index, 1)

    setEditingPlan({
      ...editingPlan,
      features: updatedFeatures,
    })
  }

  // Handle editing state filing fees
  const handleEditState = (state: string) => {
    setEditingState(state)
    setEditedStateFee(pricingData.stateFilingFees[state] || 0)
    setEditedStateDiscount(pricingData.stateDiscounts[state] || "")
    setEditedStateDescription(pricingData.stateDescriptions[state] || "")
  }

  // Handle saving state filing fee changes
  const handleSaveStateChanges = () => {
    if (!editingState) return

    const updatedStateFilingFees = { ...pricingData.stateFilingFees }
    updatedStateFilingFees[editingState] = Number(editedStateFee)

    const updatedStateDiscounts = { ...pricingData.stateDiscounts }
    if (editedStateDiscount && Number(editedStateDiscount) > 0) {
      updatedStateDiscounts[editingState] = Number(editedStateDiscount)
    } else {
      delete updatedStateDiscounts[editingState]
    }

    const updatedStateDescriptions = { ...pricingData.stateDescriptions }
    updatedStateDescriptions[editingState] = editedStateDescription

    const updatedPricingData = {
      ...pricingData,
      stateFilingFees: updatedStateFilingFees,
      stateDiscounts: updatedStateDiscounts,
      stateDescriptions: updatedStateDescriptions,
    }
    updatePricingData(updatedPricingData)

    setEditingState(null)

    // Save changes to the API
    savePricingData()

    toast({
      title: "Success",
      description: `State filing fee for ${editingState} updated successfully.`,
    })
  }

  // Handle canceling state editing
  const handleCancelStateEdit = () => {
    setEditingState(null)
  }

  // View subscription details
  const viewSubscriptionDetails = (subscription: CustomerSubscription) => {
    setSelectedSubscription(subscription)
    setShowSubscriptionDialog(true)
  }

  // Filter and sort subscriptions
  const filteredSubscriptions = customerSubscriptions
    .filter((subscription) => {
      return (
        subscription.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "highest":
          return b.amount - a.amount
        case "lowest":
          return a.amount - b.amount
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  // Add pagination logic after the filteredSubscriptions declaration
  // Find the existing filteredSubscriptions code and add this after it:

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSubscriptions = filteredSubscriptions.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)

  // Add pagination navigation functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Export subscriptions to CSV
  const exportSubscriptions = () => {
    // Create CSV header
    let csv = "Invoice Number,Customer,Email,Package,Amount,Payment Date\n"

    // Add each subscription as a row
    filteredSubscriptions.forEach((subscription) => {
      const paymentDate = subscription.paymentDate
        ? new Date(subscription.paymentDate).toLocaleDateString()
        : new Date(subscription.createdAt).toLocaleDateString()

      csv += `${subscription.invoiceNumber},"${subscription.customerName}","${subscription.customerEmail}","${subscription.packageName}",${subscription.amount},${paymentDate}\n`
    })

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "customer_subscriptions.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: `${filteredSubscriptions.length} subscriptions exported to CSV`,
    })
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and state filing fees</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={fetchPricingData}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={savePricingData} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <p className="text-sm mt-1">
              If this error persists, please check that the server has write permissions to the data directory.
            </p>
          </div>
        </div>
      )}

      {contextError && error !== contextError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Context Error</p>
            <p>{contextError}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="states">State Filing Fees</TabsTrigger>
          <TabsTrigger value="customers">Customer Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddPlan} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingData.plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {plan.isRecommended && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">
                        Recommended
                      </span>
                    )}
                    {plan.billingCycle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-2xl font-bold">{plan.displayPrice}</div>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="states" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>State Filing Fees</CardTitle>
              <CardDescription>Manage state filing fees, discounts, and descriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">State</th>
                      <th className="text-left p-4 font-medium text-sm">Filing Fee</th>
                      <th className="text-left p-4 font-medium text-sm">Discounted Fee</th>
                      <th className="text-left p-4 font-medium text-sm">Description</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(pricingData.stateFilingFees)
                      .sort()
                      .map((state) => (
                        <tr key={state} className="border-b">
                          <td className="p-4 font-medium">{state}</td>
                          <td className="p-4">
                            {editingState === state ? (
                              <Input
                                type="number"
                                value={editedStateFee}
                                onChange={(e) => setEditedStateFee(e.target.value)}
                                className="w-24"
                              />
                            ) : (
                              <>${pricingData.stateFilingFees[state]}</>
                            )}
                          </td>
                          <td className="p-4">
                            {editingState === state ? (
                              <Input
                                type="number"
                                value={editedStateDiscount}
                                onChange={(e) => setEditedStateDiscount(e.target.value)}
                                className="w-24"
                                placeholder="No discount"
                              />
                            ) : pricingData.stateDiscounts[state] ? (
                              <span className="text-green-600">${pricingData.stateDiscounts[state]}</span>
                            ) : (
                              <span className="text-gray-400">No discount</span>
                            )}
                          </td>
                          <td className="p-4">
                            {editingState === state ? (
                              <Textarea
                                value={editedStateDescription}
                                onChange={(e) => setEditedStateDescription(e.target.value)}
                                className="min-h-[80px]"
                              />
                            ) : (
                              <div className="max-w-md text-sm">{pricingData.stateDescriptions[state]}</div>
                            )}
                          </td>
                          <td className="p-4">
                            {editingState === state ? (
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={handleCancelStateEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveStateChanges}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleEditState(state)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          {/* Customer Subscriptions Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold">Customer Subscriptions</h2>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={fetchCustomerSubscriptions}
                  disabled={loadingSubscriptions}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loadingSubscriptions ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="flex items-center" onClick={exportSubscriptions}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search subscriptions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* In the Search and Sort section, add items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1) // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Amount</SelectItem>
                    <SelectItem value="lowest">Lowest Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingSubscriptions ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : subscriptionError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p>{subscriptionError}</p>
                </div>
              </div>
            ) : (
              // Replace the Card component with this updated version that includes pagination
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-sm">Invoice</th>
                        <th className="text-left p-4 font-medium text-sm">Customer</th>
                        <th className="text-left p-4 font-medium text-sm">Package</th>
                        <th className="text-left p-4 font-medium text-sm">Amount</th>
                        <th className="text-left p-4 font-medium text-sm">Payment Date</th>
                        <th className="text-left p-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No subscriptions found
                          </td>
                        </tr>
                      ) : (
                        currentSubscriptions.map((subscription) => (
                          <tr key={subscription.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-4">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{subscription.invoiceNumber}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{subscription.customerName}</p>
                                <p className="text-sm text-gray-500">{subscription.customerEmail}</p>
                              </div>
                            </td>
                            <td className="p-4 font-medium">{subscription.packageName}</td>
                            <td className="p-4 font-medium">${subscription.amount.toFixed(2)}</td>
                            <td className="p-4 text-gray-500">
                              {formatDate(subscription.paymentDate || subscription.createdAt)}
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="sm" onClick={() => viewSubscriptionDetails(subscription)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredSubscriptions.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubscriptions.length)} of{" "}
                      {filteredSubscriptions.length} subscriptions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                        Previous
                      </Button>

                      {/* Page number buttons */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around the current page
                          let pageToShow: number
                          if (totalPages <= 5) {
                            pageToShow = i + 1
                          } else if (currentPage <= 3) {
                            pageToShow = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageToShow = totalPages - 4 + i
                          } else {
                            pageToShow = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageToShow}
                              variant={currentPage === pageToShow ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => goToPage(pageToShow)}
                            >
                              {pageToShow}
                            </Button>
                          )
                        })}
                      </div>

                      <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Edit Dialog - Updated for better responsiveness and scrolling */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-950 pt-4 pb-2 z-10">
            <DialogTitle>{editingPlan?.id ? "Edit" : "Create New"} Subscription Plan</DialogTitle>
            <DialogDescription>
              {editingPlan?.id
                ? "Update the details of this subscription plan."
                : "Define a new subscription plan for your customers."}
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plan-name" className="text-right">
                  Plan Name
                </Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Professional Plus"
                  className="col-span-3"
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
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => {
                      const price = Number(e.target.value)
                      setEditingPlan({
                        ...editingPlan,
                        price,
                        displayPrice: `$${price}`,
                      })
                    }}
                    placeholder="49.99"
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Billing Cycle</Label>
                <div className="col-span-3">
                  <Select
                    value={editingPlan.billingCycle}
                    onValueChange={(value) => setEditingPlan({ ...editingPlan, billingCycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="plan-description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Brief description of the plan"
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="includes-package" className="text-right">
                  Includes Package
                </Label>
                <Input
                  id="includes-package"
                  value={editingPlan.includesPackage}
                  onChange={(e) => setEditingPlan({ ...editingPlan, includesPackage: e.target.value })}
                  placeholder="e.g. Basic"
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plan-recommended" className="text-right">
                  Recommended
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="plan-recommended"
                    checked={editingPlan.isRecommended}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, isRecommended: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assist-badge" className="text-right">
                  Assist Badge
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="assist-badge"
                    checked={editingPlan.hasAssistBadge}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, hasAssistBadge: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Features</Label>
                <div className="col-span-3 space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const updatedFeatures = [...editingPlan.features]
                          updatedFeatures[index] = e.target.value
                          setEditingPlan({ ...editingPlan, features: updatedFeatures })
                        }}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFeature(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add a new feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddFeature()
                        }
                      }}
                    />
                    <Button variant="outline" size="icon" onClick={handleAddFeature} disabled={!newFeature.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-950 pt-2 pb-4 z-10">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSavePlan}>
              {editingPlan?.id ? "Update" : "Create"} Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Updated for better responsiveness */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[450px] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription plan and remove it from the
              pricing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription Details Dialog */}
      {selectedSubscription && (
        <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white dark:bg-gray-950 pt-4 pb-2 z-10">
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>Viewing details for invoice {selectedSubscription.invoiceNumber}</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Subscription Header */}
              <div className="flex flex-col md:flex-row md:justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold mb-1">Customer Information</h3>
                  <p className="font-medium">{selectedSubscription.customerName}</p>
                  <p className="text-gray-500">{selectedSubscription.customerEmail}</p>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p>{formatDate(selectedSubscription.paymentDate || selectedSubscription.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p>{selectedSubscription.invoiceNumber}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Subscription Details</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-medium">{selectedSubscription.packageName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">${selectedSubscription.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Items */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-sm">Item</th>
                      <th className="text-right p-2 font-medium text-sm">Price</th>
                      <th className="text-right p-2 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedSubscription.items) ? (
                      selectedSubscription.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div>
                              <p>{item.tier} Package</p>
                              {item.state && <p className="text-sm text-gray-500">{item.state} State Filing Fee</p>}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <div>
                              <p>${item.price.toFixed(2)}</p>
                              {item.stateFee && <p className="text-sm text-gray-500">${item.stateFee.toFixed(2)}</p>}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            ${(item.price + (item.stateFee || 0) - (item.discount || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-gray-500">
                          No items found or invalid items format
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="p-2 text-right font-medium">
                        Total
                      </td>
                      <td className="p-2 text-right font-bold">${selectedSubscription.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-950 pt-2 pb-4 z-10">
              <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Paid
        </span>
      )
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
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

