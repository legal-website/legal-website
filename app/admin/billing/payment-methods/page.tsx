"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Check, Edit, Plus, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define types for our pricing data
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

  // State for editing plans
  const [editingPlanId, setEditingPlanId] = useState<number | string | null>(null)
  const [planName, setPlanName] = useState("")
  const [planPrice, setPlanPrice] = useState(0)
  const [planDescription, setPlanDescription] = useState("")
  const [planFeatures, setPlanFeatures] = useState<string[]>([])
  const [planIsRecommended, setPlanIsRecommended] = useState(false)
  const [planIncludesPackage, setPlanIncludesPackage] = useState("")
  const [planHasAssistBadge, setPlanHasAssistBadge] = useState(false)
  const [planBillingCycle, setPlanBillingCycle] = useState("one-time")
  const [newFeature, setNewFeature] = useState("")

  // State for editing states
  const [editingState, setEditingState] = useState<string | null>(null)
  const [stateFee, setStateFee] = useState(0)
  const [stateDiscount, setStateDiscount] = useState<number | null>(null)
  const [stateDescription, setStateDescription] = useState("")

  // State for adding new plan
  const [showAddPlan, setShowAddPlan] = useState(false)

  // State for adding new state
  const [showAddState, setShowAddState] = useState(false)
  const [newStateName, setNewStateName] = useState("")
  const [newStateFee, setNewStateFee] = useState(0)
  const [newStateDiscount, setNewStateDiscount] = useState<number | null>(null)
  const [newStateDescription, setNewStateDescription] = useState("")

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
          description: "Failed to load pricing data",
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
        description: "Pricing data saved successfully",
      })
    } catch (error) {
      console.error("Error saving pricing data:", error)
      toast({
        title: "Error",
        description: "Failed to save pricing data",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Start editing a plan
  const startEditingPlan = (plan: PricingTier) => {
    setEditingPlanId(plan.id)
    setPlanName(plan.name)
    setPlanPrice(plan.price)
    setPlanDescription(plan.description)
    setPlanFeatures([...plan.features])
    setPlanIsRecommended(plan.isRecommended || false)
    setPlanIncludesPackage(plan.includesPackage || "")
    setPlanHasAssistBadge(plan.hasAssistBadge || false)
    setPlanBillingCycle(plan.billingCycle)
    setShowAddPlan(true)
  }

  // Save plan changes
  const savePlanChanges = () => {
    if (editingPlanId) {
      // Update existing plan
      setPricingData((prev) => ({
        ...prev,
        plans: prev.plans.map((plan) =>
          plan.id === editingPlanId
            ? {
                ...plan,
                name: planName,
                price: planPrice,
                displayPrice: `$${planPrice}`,
                description: planDescription,
                features: planFeatures,
                isRecommended: planIsRecommended,
                includesPackage: planIncludesPackage || undefined,
                hasAssistBadge: planHasAssistBadge,
                billingCycle: planBillingCycle,
              }
            : plan,
        ),
      }))
    } else {
      // Add new plan
      const newPlan: PricingTier = {
        id: Date.now(),
        name: planName,
        price: planPrice,
        displayPrice: `$${planPrice}`,
        description: planDescription,
        features: planFeatures,
        isRecommended: planIsRecommended,
        includesPackage: planIncludesPackage || undefined,
        hasAssistBadge: planHasAssistBadge,
        billingCycle: planBillingCycle,
      }

      setPricingData((prev) => ({
        ...prev,
        plans: [...prev.plans, newPlan],
      }))
    }

    // Reset form
    resetPlanForm()
    setShowAddPlan(false)

    toast({
      title: "Success",
      description: editingPlanId ? "Plan updated successfully" : "Plan added successfully",
    })
  }

  // Reset plan form
  const resetPlanForm = () => {
    setEditingPlanId(null)
    setPlanName("")
    setPlanPrice(0)
    setPlanDescription("")
    setPlanFeatures([])
    setPlanIsRecommended(false)
    setPlanIncludesPackage("")
    setPlanHasAssistBadge(false)
    setPlanBillingCycle("one-time")
    setNewFeature("")
  }

  // Add feature to plan
  const addFeature = () => {
    if (newFeature.trim()) {
      setPlanFeatures((prev) => [...prev, newFeature.trim()])
      setNewFeature("")
    }
  }

  // Remove feature from plan
  const removeFeature = (index: number) => {
    setPlanFeatures((prev) => prev.filter((_, i) => i !== index))
  }

  // Delete plan
  const deletePlan = (id: number | string) => {
    setPricingData((prev) => ({
      ...prev,
      plans: prev.plans.filter((plan) => plan.id !== id),
    }))

    toast({
      title: "Success",
      description: "Plan deleted successfully",
    })
  }

  // Start editing a state
  const startEditingState = (state: string) => {
    setEditingState(state)
    setStateFee(pricingData.stateFilingFees[state])
    setStateDiscount(pricingData.stateDiscounts[state] || null)
    setStateDescription(pricingData.stateDescriptions[state] || "")
  }

  // Save state changes
  const saveStateChanges = () => {
    if (editingState) {
      // Update existing state
      const updatedFilingFees = { ...pricingData.stateFilingFees }
      updatedFilingFees[editingState] = stateFee

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

      // Reset form
      setEditingState(null)
      setStateFee(0)
      setStateDiscount(null)
      setStateDescription("")

      toast({
        title: "Success",
        description: "State updated successfully",
      })
    }
  }

  // Add new state
  const addNewState = () => {
    if (newStateName.trim()) {
      const updatedFilingFees = { ...pricingData.stateFilingFees }
      updatedFilingFees[newStateName] = newStateFee

      const updatedDiscounts = { ...pricingData.stateDiscounts }
      if (newStateDiscount !== null) {
        updatedDiscounts[newStateName] = newStateDiscount
      }

      const updatedDescriptions = { ...pricingData.stateDescriptions }
      updatedDescriptions[newStateName] = newStateDescription

      setPricingData((prev) => ({
        ...prev,
        stateFilingFees: updatedFilingFees,
        stateDiscounts: updatedDiscounts,
        stateDescriptions: updatedDescriptions,
      }))

      // Reset form
      setNewStateName("")
      setNewStateFee(0)
      setNewStateDiscount(null)
      setNewStateDescription("")
      setShowAddState(false)

      toast({
        title: "Success",
        description: "State added successfully",
      })
    }
  }

  // Delete state
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
      title: "Success",
      description: "State deleted successfully",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
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

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Pricing Plans</h2>
            <Button
              onClick={() => {
                resetPlanForm()
                setShowAddPlan(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </div>

          {/* Plans List */}
          <div className="grid gap-4">
            {pricingData.plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {plan.name}
                      {plan.isRecommended && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                      {plan.hasAssistBadge && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Assist
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ${plan.price} - {plan.billingCycle}
                    </p>
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
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{plan.description}</p>
                  {plan.includesPackage && (
                    <p className="text-sm font-medium mb-2">Includes {plan.includesPackage} package</p>
                  )}
                  <h4 className="font-medium mb-1">Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add/Edit Plan Form */}
          {showAddPlan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingPlanId ? "Edit Plan" : "Add New Plan"}</h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan-name">Plan Name</Label>
                      <Input
                        id="plan-name"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="e.g., STARTER"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-price">Price ($)</Label>
                      <Input
                        id="plan-price"
                        type="number"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(Number(e.target.value))}
                        placeholder="e.g., 129"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="plan-description">Description</Label>
                    <Textarea
                      id="plan-description"
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      placeholder="Brief description of the plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan-package">Included Package</Label>
                      <Input
                        id="plan-package"
                        value={planIncludesPackage}
                        onChange={(e) => setPlanIncludesPackage(e.target.value)}
                        placeholder="e.g., Basic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-billing">Billing Cycle</Label>
                      <select
                        id="plan-billing"
                        className="w-full p-2 border rounded"
                        value={planBillingCycle}
                        onChange={(e) => setPlanBillingCycle(e.target.value)}
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="plan-recommended" checked={planIsRecommended} onCheckedChange={setPlanIsRecommended} />
                    <Label htmlFor="plan-recommended">Recommended Plan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="plan-assist" checked={planHasAssistBadge} onCheckedChange={setPlanHasAssistBadge} />
                    <Label htmlFor="plan-assist">Show Assist Badge</Label>
                  </div>
                  <div>
                    <Label>Features</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addFeature()
                          }
                        }}
                      />
                      <Button type="button" onClick={addFeature}>
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {planFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{feature}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddPlan(false)}>
                      Cancel
                    </Button>
                    <Button onClick={savePlanChanges}>{editingPlanId ? "Update Plan" : "Add Plan"}</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* States Tab */}
        <TabsContent value="states">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage State Filing Fees</h2>
            <Button onClick={() => setShowAddState(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New State
            </Button>
          </div>

          {/* States Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    State
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Filing Fee
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(pricingData.stateFilingFees)
                  .sort()
                  .map((state) => (
                    <tr key={state}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{state}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${pricingData.stateFilingFees[state]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pricingData.stateDiscounts[state] ? (
                          <span className="text-green-600">${pricingData.stateDiscounts[state]}</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {pricingData.stateDescriptions[state]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => startEditingState(state)} className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteState(state)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Edit State Form */}
          {editingState && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit State: {editingState}</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="state-fee">Filing Fee ($)</Label>
                    <Input
                      id="state-fee"
                      type="number"
                      value={stateFee}
                      onChange={(e) => setStateFee(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state-discount">Discount ($) (Optional)</Label>
                    <Input
                      id="state-discount"
                      type="number"
                      value={stateDiscount === null ? "" : stateDiscount}
                      onChange={(e) => setStateDiscount(e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="Leave empty for no discount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state-description">Description</Label>
                    <Textarea
                      id="state-description"
                      value={stateDescription}
                      onChange={(e) => setStateDescription(e.target.value)}
                      placeholder="e.g., Annual Report: $50 (10th April)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setEditingState(null)}>
                      Cancel
                    </Button>
                    <Button onClick={saveStateChanges}>Save Changes</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add State Form */}
          {showAddState && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New State</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="new-state-name">State Name</Label>
                    <Input
                      id="new-state-name"
                      value={newStateName}
                      onChange={(e) => setNewStateName(e.target.value)}
                      placeholder="e.g., California"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-state-fee">Filing Fee ($)</Label>
                    <Input
                      id="new-state-fee"
                      type="number"
                      value={newStateFee}
                      onChange={(e) => setNewStateFee(Number(e.target.value))}
                      placeholder="e.g., 70"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-state-discount">Discount ($) (Optional)</Label>
                    <Input
                      id="new-state-discount"
                      type="number"
                      value={newStateDiscount === null ? "" : newStateDiscount}
                      onChange={(e) => setNewStateDiscount(e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="Leave empty for no discount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-state-description">Description</Label>
                    <Textarea
                      id="new-state-description"
                      value={newStateDescription}
                      onChange={(e) => setNewStateDescription(e.target.value)}
                      placeholder="e.g., Annual Report: $800 minimum tax + $20 filing fee (15th day of 4th month)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddState(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addNewState}>Add State</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

