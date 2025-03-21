"use client"

import { useState, useEffect } from "react"
import { usePricing, type PricingPlan } from "@/context/pricing-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, RefreshCw, Check, X } from "lucide-react"

export default function PricingManagement() {
  const { pricingData, loading, error, refreshPricingData, updatePricingData, lastUpdated } = usePricing()
  const [activeTab, setActiveTab] = useState("plans")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)

  // State for plans
  const [editedPlans, setEditedPlans] = useState<PricingPlan[]>([])

  // State for state filing fees
  const [selectedState, setSelectedState] = useState<string>("Alabama")
  const [editedStateFilingFees, setEditedStateFilingFees] = useState<{ [state: string]: number }>({})

  // State for state descriptions
  const [editedStateDescriptions, setEditedStateDescriptions] = useState<{ [state: string]: string }>({})

  // Initialize edited data from pricing data
  useEffect(() => {
    if (pricingData && pricingData.plans) {
      // Deep clone the plans to avoid reference issues
      setEditedPlans(JSON.parse(JSON.stringify(pricingData.plans)))

      // Deep clone the state filing fees
      setEditedStateFilingFees(JSON.parse(JSON.stringify(pricingData.stateFilingFees || {})))

      // Deep clone the state descriptions
      setEditedStateDescriptions(JSON.parse(JSON.stringify(pricingData.stateDescriptions || {})))
    }
  }, [pricingData])

  // Handle plan changes
  const handlePlanChange = (planId: number, field: keyof PricingPlan, value: any) => {
    setEditedPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              [field]: value,
              // Update displayPrice if price is changed
              ...(field === "price" ? { displayPrice: `$${value}` } : {}),
            }
          : plan,
      ),
    )
  }

  // Handle feature changes
  const handleFeatureChange = (planId: number, index: number, value: string) => {
    setEditedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          const newFeatures = [...plan.features]
          newFeatures[index] = value
          return { ...plan, features: newFeatures }
        }
        return plan
      }),
    )
  }

  // Handle adding a feature
  const handleAddFeature = (planId: number) => {
    setEditedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          return { ...plan, features: [...plan.features, "New Feature"] }
        }
        return plan
      }),
    )
  }

  // Handle removing a feature
  const handleRemoveFeature = (planId: number, index: number) => {
    setEditedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          const newFeatures = [...plan.features]
          newFeatures.splice(index, 1)
          return { ...plan, features: newFeatures }
        }
        return plan
      }),
    )
  }

  // Handle state filing fee change
  const handleStateFilingFeeChange = (state: string, value: number) => {
    setEditedStateFilingFees((prev) => ({
      ...prev,
      [state]: value,
    }))
  }

  // Handle state description change
  const handleStateDescriptionChange = (state: string, value: string) => {
    setEditedStateDescriptions((prev) => ({
      ...prev,
      [state]: value,
    }))
  }

  // Save all changes
  const handleSaveAll = async () => {
    setIsUpdating(true)
    setUpdateMessage("Saving changes...")
    setUpdateSuccess(null)

    try {
      // Create updated pricing data
      const updatedData = {
        ...pricingData,
        plans: editedPlans,
        stateFilingFees: editedStateFilingFees,
        stateDescriptions: editedStateDescriptions,
      }

      console.log("Saving updated pricing data:", {
        planCount: updatedData.plans.length,
        stateCount: Object.keys(updatedData.stateFilingFees).length,
        plans: updatedData.plans.map((p) => `${p.name}: $${p.price}`).join(", "),
      })

      const success = await updatePricingData(updatedData)

      if (success) {
        setUpdateMessage("Changes saved successfully!")
        setUpdateSuccess(true)

        // Refresh data after a short delay
        setTimeout(() => {
          refreshPricingData()
        }, 1000)
      } else {
        setUpdateMessage("Failed to save changes. Please try again.")
        setUpdateSuccess(false)
      }
    } catch (error) {
      console.error("Error saving pricing data:", error)
      setUpdateMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
      setUpdateSuccess(false)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setUpdateMessage("Refreshing data...")
      setUpdateSuccess(null)
      await refreshPricingData()
      setUpdateMessage("Data refreshed successfully!")
      setUpdateSuccess(true)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setUpdateMessage(`Error refreshing: ${error instanceof Error ? error.message : String(error)}`)
      setUpdateSuccess(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage pricing plans, state filing fees, and descriptions
          </p>
          {lastUpdated && <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated.toLocaleString()}</p>}
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleRefresh}
            disabled={isUpdating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center"
            onClick={handleSaveAll}
            disabled={isUpdating}
          >
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
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

      {updateMessage && (
        <div
          className={`px-4 py-3 rounded mb-6 flex items-start ${
            updateSuccess === true
              ? "bg-green-50 border border-green-200 text-green-700"
              : updateSuccess === false
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-blue-50 border border-blue-200 text-blue-700"
          }`}
        >
          {updateSuccess === true ? (
            <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          ) : updateSuccess === false ? (
            <X className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <RefreshCw className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
          )}
          <p>{updateMessage}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="states">State Filing Fees</TabsTrigger>
          <TabsTrigger value="descriptions">State Descriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {editedPlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className={`${plan.isRecommended ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                  <CardTitle className="flex justify-between items-center">
                    <Input
                      value={plan.name}
                      onChange={(e) => handlePlanChange(plan.id, "name", e.target.value)}
                      className="font-bold text-xl w-1/3"
                    />
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <span className="mr-2">$</span>
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={(e) => handlePlanChange(plan.id, "price", Number(e.target.value))}
                          className="w-24"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm">Recommended:</label>
                        <input
                          type="checkbox"
                          checked={plan.isRecommended}
                          onChange={(e) => handlePlanChange(plan.id, "isRecommended", e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={plan.description}
                      onChange={(e) => handlePlanChange(plan.id, "description", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Features</label>
                      <Button variant="outline" size="sm" onClick={() => handleAddFeature(plan.id)}>
                        Add Feature
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={feature}
                            onChange={(e) => handleFeatureChange(plan.id, index, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFeature(plan.id, index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Package Included</label>
                      <Input
                        value={plan.includesPackage || ""}
                        onChange={(e) => handlePlanChange(plan.id, "includesPackage", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Assist Badge:</label>
                      <input
                        type="checkbox"
                        checked={plan.hasAssistBadge || false}
                        onChange={(e) => handlePlanChange(plan.id, "hasAssistBadge", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(editedStateFilingFees)
                  .sort()
                  .map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <span className="w-1/2 truncate">{state}:</span>
                      <span>$</span>
                      <Input
                        type="number"
                        value={editedStateFilingFees[state]}
                        onChange={(e) => handleStateFilingFeeChange(state, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>State Descriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select State</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {Object.keys(editedStateDescriptions)
                      .sort()
                      .map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedState && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={editedStateDescriptions[selectedState] || ""}
                      onChange={(e) => handleStateDescriptionChange(selectedState, e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

