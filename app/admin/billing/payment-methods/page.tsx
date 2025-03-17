"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, Edit, Plus, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PricingTier {
  id: number | string
  name: string
  price: number
  displayPrice?: string
  description: string
  features: string[]
  isRecommended?: boolean
  includesPackage?: string
  hasAssistBadge?: boolean
  billingCycle: string
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
  plans: PricingTier[]
  stateFilingFees: StateFilingFees
  stateDiscounts: StateDiscounts
  stateDescriptions: StateDescriptions
}

export default function PricingManagementPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })
  const [editingPlan, setEditingPlan] = useState<PricingTier | null>(null)
  const [newFeature, setNewFeature] = useState("")
  const [editingState, setEditingState] = useState<string | null>(null)
  const [stateFilingFee, setStateFilingFee] = useState<number>(0)
  const [stateDiscount, setStateDiscount] = useState<number | null>(null)
  const [stateDescription, setStateDescription] = useState<string>("")
  const [showAddPlanDialog, setShowAddPlanDialog] = useState(false)
  const [newPlan, setNewPlan] = useState<PricingTier>({
    id: Date.now(),
    name: "",
    price: 0,
    description: "",
    features: [],
    isRecommended: false,
    includesPackage: "",
    hasAssistBadge: false,
    billingCycle: "one-time",
  })
  const [showAddStateDialog, setShowAddStateDialog] = useState(false)
  const [newState, setNewState] = useState({
    name: "",
    fee: 0,
    discount: null as number | null,
    description: "",
  })

  // Fetch pricing data
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/pricing")
        if (!response.ok) {
          throw new Error("Failed to fetch pricing data")
        }
        const data = await response.json()
        setPricingData(data)
      } catch (error) {
        console.error("Error fetching pricing data:", error)
        toast({
          title: "Error",
          description: "Failed to load pricing data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPricingData()
  }, [toast])

  // Save pricing data
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
        description: "Pricing data saved successfully.",
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

  // Handle plan editing
  const startEditingPlan = (plan: PricingTier) => {
    setEditingPlan({ ...plan })
  }

  const savePlanChanges = () => {
    if (!editingPlan) return

    setPricingData((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === editingPlan.id ? { ...editingPlan } : plan)),
    }))

    setEditingPlan(null)
    toast({
      title: "Plan Updated",
      description: "Plan changes have been applied. Don't forget to save all changes.",
    })
  }

  const addFeatureToPlan = () => {
    if (!newFeature.trim() || !editingPlan) return

    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()],
    })

    setNewFeature("")
  }

  const removeFeatureFromPlan = (index: number) => {
    if (!editingPlan) return

    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    })
  }

  const addNewPlan = () => {
    if (!newPlan.name.trim() || newPlan.price < 0) {
      toast({
        title: "Invalid Plan",
        description: "Please provide a valid name and price for the plan.",
        variant: "destructive",
      })
      return
    }

    setPricingData((prev) => ({
      ...prev,
      plans: [...prev.plans, { ...newPlan, id: Date.now() }],
    }))

    setNewPlan({
      id: Date.now(),
      name: "",
      price: 0,
      description: "",
      features: [],
      isRecommended: false,
      includesPackage: "",
      hasAssistBadge: false,
      billingCycle: "one-time",
    })

    setShowAddPlanDialog(false)
    toast({
      title: "Plan Added",
      description: "New plan has been added. Don't forget to save all changes.",
    })
  }

  const deletePlan = (id: number | string) => {
    setPricingData((prev) => ({
      ...prev,
      plans: prev.plans.filter((plan) => plan.id !== id),
    }))

    toast({
      title: "Plan Deleted",
      description: "Plan has been removed. Don't forget to save all changes.",
    })
  }

  // Handle state editing
  const startEditingState = (state: string) => {
    setEditingState(state)
    setStateFilingFee(pricingData.stateFilingFees[state])
    setStateDiscount(pricingData.stateDiscounts[state] || null)
    setStateDescription(pricingData.stateDescriptions[state] || "")
  }

  const saveStateChanges = () => {
    if (!editingState) return

    const updatedFilingFees = { ...pricingData.stateFilingFees }
    updatedFilingFees[editingState] = stateFilingFee

    const updatedDiscounts = { ...pricingData.stateDiscounts }
    if (stateDiscount !== null) {
      updatedDiscounts[editingState] = stateDiscount
    } else {
      delete updatedDiscounts[editingState]
    }

    const updatedDescriptions = { ...pricingData.stateDescriptions }
    updatedDescriptions[editingState] = stateDescription

    setPricingData((prev) => ({
      ...prev,
      stateFilingFees: updatedFilingFees,
      stateDiscounts: updatedDiscounts,
      stateDescriptions: updatedDescriptions,
    }))

    setEditingState(null)
    toast({
      title: "State Updated",
      description: "State information has been updated. Don't forget to save all changes.",
    })
  }

  const addNewState = () => {
    if (!newState.name.trim() || newState.fee < 0) {
      toast({
        title: "Invalid State",
        description: "Please provide a valid state name and filing fee.",
        variant: "destructive",
      })
      return
    }

    const updatedFilingFees = { ...pricingData.stateFilingFees }
    updatedFilingFees[newState.name] = newState.fee

    const updatedDiscounts = { ...pricingData.stateDiscounts }
    if (newState.discount !== null) {
      updatedDiscounts[newState.name] = newState.discount
    }

    const updatedDescriptions = { ...pricingData.stateDescriptions }
    updatedDescriptions[newState.name] = newState.description

    setPricingData((prev) => ({
      ...prev,
      stateFilingFees: updatedFilingFees,
      stateDiscounts: updatedDiscounts,
      stateDescriptions: updatedDescriptions,
    }))

    setNewState({
      name: "",
      fee: 0,
      discount: null,
      description: "",
    })

    setShowAddStateDialog(false)
    toast({
      title: "State Added",
      description: "New state has been added. Don't forget to save all changes.",
    })
  }

  const deleteState = (state: string) => {
    const updatedFilingFees = { ...pricingData.stateFilingFees }
    delete updatedFilingFees[state]

    const updatedDiscounts = { ...pricingData.stateDiscounts }
    delete updatedDiscounts[state]

    const updatedDescriptions = { ...pricingData.stateDescriptions }
    delete updatedDescriptions[state]

    setPricingData((prev) => ({
      ...prev,
      stateFilingFees: updatedFilingFees,
      stateDiscounts: updatedDiscounts,
      stateDescriptions: updatedDescriptions,
    }))

    toast({
      title: "State Deleted",
      description: "State has been removed. Don't forget to save all changes.",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <Button onClick={savePricingData} disabled={saving}>
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
          <TabsTrigger value="states">State Filing Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Manage Pricing Plans</h2>
            <Dialog open={showAddPlanDialog} onOpenChange={setShowAddPlanDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Pricing Plan</DialogTitle>
                  <DialogDescription>Create a new pricing plan to offer to your customers.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-plan-name">Plan Name</Label>
                      <Input
                        id="new-plan-name"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="e.g., STARTER"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-plan-price">Price ($)</Label>
                      <Input
                        id="new-plan-price"
                        type="number"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                        placeholder="e.g., 129"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-plan-description">Description</Label>
                    <Textarea
                      id="new-plan-description"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Brief description of the plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-plan-package">Included Package</Label>
                      <Input
                        id="new-plan-package"
                        value={newPlan.includesPackage}
                        onChange={(e) => setNewPlan({ ...newPlan, includesPackage: e.target.value })}
                        placeholder="e.g., Basic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-plan-billing">Billing Cycle</Label>
                      <select
                        id="new-plan-billing"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newPlan.billingCycle}
                        onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="new-plan-recommended"
                      checked={newPlan.isRecommended}
                      onCheckedChange={(checked) => setNewPlan({ ...newPlan, isRecommended: checked })}
                    />
                    <Label htmlFor="new-plan-recommended">Recommended Plan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="new-plan-assist"
                      checked={newPlan.hasAssistBadge}
                      onCheckedChange={(checked) => setNewPlan({ ...newPlan, hasAssistBadge: checked })}
                    />
                    <Label htmlFor="new-plan-assist">Show Assist Badge</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newFeature.trim()) {
                            setNewPlan({
                              ...newPlan,
                              features: [...newPlan.features, newFeature.trim()],
                            })
                            setNewFeature("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {newPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                          <span>{feature}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewPlan({
                                ...newPlan,
                                features: newPlan.features.filter((_, i) => i !== index),
                              })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddPlanDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNewPlan}>Add Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {pricingData.plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {plan.name}
                        {plan.isRecommended && <Badge className="ml-2 bg-green-500">Recommended</Badge>}
                        {plan.hasAssistBadge && <Badge className="ml-2 bg-blue-500">Assist</Badge>}
                      </CardTitle>
                      <CardDescription>
                        ${plan.price} - {plan.billingCycle}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => startEditingPlan(plan)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deletePlan(plan.id)}>
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{plan.description}</p>
                  {plan.includesPackage && (
                    <p className="text-sm font-medium mb-2">Includes {plan.includesPackage} package</p>
                  )}
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Plan Dialog */}
          {editingPlan && (
            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Pricing Plan</DialogTitle>
                  <DialogDescription>Make changes to the pricing plan details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name">Plan Name</Label>
                      <Input
                        id="plan-name"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-price">Price ($)</Label>
                      <Input
                        id="plan-price"
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description</Label>
                    <Textarea
                      id="plan-description"
                      value={editingPlan.description}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-package">Included Package</Label>
                      <Input
                        id="plan-package"
                        value={editingPlan.includesPackage || ""}
                        onChange={(e) => setEditingPlan({ ...editingPlan, includesPackage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-billing">Billing Cycle</Label>
                      <select
                        id="plan-billing"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={editingPlan.billingCycle}
                        onChange={(e) => setEditingPlan({ ...editingPlan, billingCycle: e.target.value })}
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="plan-recommended"
                      checked={editingPlan.isRecommended || false}
                      onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, isRecommended: checked })}
                    />
                    <Label htmlFor="plan-recommended">Recommended Plan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="plan-assist"
                      checked={editingPlan.hasAssistBadge || false}
                      onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, hasAssistBadge: checked })}
                    />
                    <Label htmlFor="plan-assist">Show Assist Badge</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                      />
                      <Button type="button" onClick={addFeatureToPlan}>
                        Add
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px] mt-2">
                      <div className="space-y-2">
                        {editingPlan.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                            <span>{feature}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeFeatureFromPlan(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingPlan(null)}>
                    Cancel
                  </Button>
                  <Button onClick={savePlanChanges}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="states">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Manage State Filing Fees</h2>
            <Dialog open={showAddStateDialog} onOpenChange={setShowAddStateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New State
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New State</DialogTitle>
                  <DialogDescription>Add a new state with its filing fees and information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-state-name">State Name</Label>
                    <Input
                      id="new-state-name"
                      value={newState.name}
                      onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                      placeholder="e.g., California"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-state-fee">Filing Fee ($)</Label>
                    <Input
                      id="new-state-fee"
                      type="number"
                      value={newState.fee}
                      onChange={(e) => setNewState({ ...newState, fee: Number(e.target.value) })}
                      placeholder="e.g., 70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-state-discount">Discount ($) (Optional)</Label>
                    <Input
                      id="new-state-discount"
                      type="number"
                      value={newState.discount === null ? "" : newState.discount}
                      onChange={(e) =>
                        setNewState({
                          ...newState,
                          discount: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Leave empty for no discount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-state-description">Description</Label>
                    <Textarea
                      id="new-state-description"
                      value={newState.description}
                      onChange={(e) => setNewState({ ...newState, description: e.target.value })}
                      placeholder="e.g., Annual Report: $800 minimum tax + $20 filing fee (15th day of 4th month)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddStateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNewState}>Add State</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
              <div className="col-span-3">State</div>
              <div className="col-span-2">Filing Fee</div>
              <div className="col-span-2">Discount</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Actions</div>
            </div>
            <ScrollArea className="h-[600px]">
              {Object.keys(pricingData.stateFilingFees)
                .sort()
                .map((state) => (
                  <div key={state} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                    <div className="col-span-3">{state}</div>
                    <div className="col-span-2">${pricingData.stateFilingFees[state]}</div>
                    <div className="col-span-2">
                      {pricingData.stateDiscounts[state] ? (
                        <span className="text-green-500">${pricingData.stateDiscounts[state]}</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                    <div className="col-span-3">{pricingData.stateDescriptions[state]}</div>
                    <div className="col-span-2 flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => startEditingState(state)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteState(state)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </ScrollArea>
          </div>

          {/* Edit State Dialog */}
          {editingState && (
            <Dialog open={!!editingState} onOpenChange={(open) => !open && setEditingState(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit State: {editingState}</DialogTitle>
                  <DialogDescription>Update the filing fees and information for this state.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="state-fee">Filing Fee ($)</Label>
                    <Input
                      id="state-fee"
                      type="number"
                      value={stateFilingFee}
                      onChange={(e) => setStateFilingFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state-discount">Discount ($) (Optional)</Label>
                    <Input
                      id="state-discount"
                      type="number"
                      value={stateDiscount === null ? "" : stateDiscount}
                      onChange={(e) => setStateDiscount(e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="Leave empty for no discount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state-description">Description</Label>
                    <Textarea
                      id="state-description"
                      value={stateDescription}
                      onChange={(e) => setStateDescription(e.target.value)}
                      placeholder="e.g., Annual Report: $50 (10th April)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingState(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveStateChanges}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

