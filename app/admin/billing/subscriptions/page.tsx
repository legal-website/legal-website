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
import { Edit, Trash2, Plus, Save, X, Check, RefreshCw, AlertCircle } from "lucide-react"
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

// Define types for our data
interface PricingPlan {
  id: number
  name: string
  price: number
  displayPrice: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended: boolean
  includesPackage: string
  hasAssistBadge: boolean
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

  // State for pricing data
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })

  // State for edited state fees
  const [editedStateFee, setEditedStateFee] = useState<number | string>("")
  const [editedStateDiscount, setEditedStateDiscount] = useState<number | string>("")
  const [editedStateDescription, setEditedStateDescription] = useState("")

  // Fetch pricing data from the API
  const fetchPricingData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        throw new Error("Failed to fetch pricing data")
      }

      const data = await response.json()
      setPricingData(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      setError("Failed to load pricing information. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
  }, [])

  // Save pricing data to the API
  const savePricingData = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricingData),
      })

      if (!response.ok) {
        throw new Error("Failed to save pricing data")
      }

      toast({
        title: "Success",
        description: "Pricing data has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving pricing data:", error)
      toast({
        title: "Error",
        description: "Failed to save pricing data. Please try again.",
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
      setPricingData({
        ...pricingData,
        plans: updatedPlans,
      })

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

    setPricingData({
      ...pricingData,
      plans: updatedPlans,
    })

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

    setPricingData({
      ...pricingData,
      stateFilingFees: updatedStateFilingFees,
      stateDiscounts: updatedStateDiscounts,
      stateDescriptions: updatedStateDescriptions,
    })

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
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="states">State Filing Fees</TabsTrigger>
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
      </Tabs>

      {/* Plan Edit Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSavePlan}>
              {editingPlan?.id ? "Update" : "Create"} Plan
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
    </div>
  )
}

