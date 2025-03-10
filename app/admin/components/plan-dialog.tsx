"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

// Define a proper type for the plan object
interface PlanType {
  id?: string | number
  name: string
  price: number
  displayPrice: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended: boolean
  hasAssistBadge: boolean
  includesPackage?: string
}

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan?: any
}

export function PlanDialog({ open, onOpenChange, editingPlan }: PlanDialogProps) {
  const isEditing = !!editingPlan

  // Update the useState call to use this type
  const [plan, setPlan] = useState<PlanType>(
    editingPlan || {
      name: "",
      price: 0,
      displayPrice: "$0",
      billingCycle: "one-time",
      description: "",
      features: [""],
      isRecommended: false,
      hasAssistBadge: false,
      includesPackage: "",
    },
  )

  // Inside the PlanDialog component, add this useEffect
  useEffect(() => {
    // When the dialog opens or editingPlan changes, update the form state
    if (open && editingPlan) {
      setPlan({ ...editingPlan })
    } else if (open && !editingPlan) {
      // Reset to default values when creating a new plan
      setPlan({
        name: "",
        price: 0,
        displayPrice: "$0",
        billingCycle: "one-time",
        description: "",
        features: [""],
        isRecommended: false,
        hasAssistBadge: false,
        includesPackage: "",
      })
    }
  }, [open, editingPlan])

  const handleSavePlan = async () => {
    try {
      // Validate required fields
      if (!plan.name || plan.price <= 0 || plan.features.some((f) => !f.trim())) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields and ensure all features have content.",
          variant: "destructive",
        })
        return
      }

      // Fetch current pricing data
      const response = await fetch("/api/pricing")
      const data = await response.json()

      // Update plans array
      let updatedPlans
      if (isEditing) {
        updatedPlans = data.plans.map((p: { id: string | number | undefined }) => (p.id === plan.id ? plan : p))
      } else {
        // Generate a new ID for the plan
        const newId = Math.max(0, ...data.plans.map((p: { id: any }) => Number(p.id))) + 1
        updatedPlans = [...data.plans, { ...plan, id: newId }]
      }

      // Save updated data
      await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          plans: updatedPlans,
        }),
      })

      // Show success message
      toast({
        title: "Success",
        description: isEditing ? "Plan updated successfully" : "New plan created successfully",
      })

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving plan:", error)
      toast({
        title: "Error",
        description: "Failed to save plan. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create New"} Subscription Plan</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this subscription plan."
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
              value={plan.name}
              onChange={(e) => setPlan({ ...plan, name: e.target.value })}
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
                type="number"
                value={plan.price}
                onChange={(e) => {
                  const price = Number.parseFloat(e.target.value)
                  setPlan({
                    ...plan,
                    price: price,
                    displayPrice: `$${price}`,
                  })
                }}
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
                  checked={plan.billingCycle === "monthly"}
                  onChange={() => setPlan({ ...plan, billingCycle: "monthly" })}
                />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="annual"
                  name="billing-cycle"
                  className="h-4 w-4"
                  checked={plan.billingCycle === "annual"}
                  onChange={() => setPlan({ ...plan, billingCycle: "annual" })}
                />
                <Label htmlFor="annual">Annual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="one-time"
                  name="billing-cycle"
                  className="h-4 w-4"
                  checked={plan.billingCycle === "one-time"}
                  onChange={() => setPlan({ ...plan, billingCycle: "one-time" })}
                />
                <Label htmlFor="one-time">One-time</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of the plan"
              className="col-span-3"
              value={plan.description}
              onChange={(e) => setPlan({ ...plan, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="includes-package" className="text-right">
              Includes Package
            </Label>
            <Input
              id="includes-package"
              placeholder="e.g. Basic, Pro (leave empty if none)"
              className="col-span-3"
              value={plan.includesPackage || ""}
              onChange={(e) => setPlan({ ...plan, includesPackage: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Recommended</Label>
            <div className="col-span-3">
              <Switch
                checked={plan.isRecommended}
                onCheckedChange={(checked) => setPlan({ ...plan, isRecommended: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Assist Badge</Label>
            <div className="col-span-3">
              <Switch
                checked={plan.hasAssistBadge}
                onCheckedChange={(checked) => setPlan({ ...plan, hasAssistBadge: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Features</Label>
            <div className="col-span-3 space-y-2">
              {plan.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="e.g. Company Formation"
                    className="flex-1"
                    value={feature}
                    onChange={(e) => {
                      const updatedFeatures = [...plan.features]
                      updatedFeatures[index] = e.target.value
                      setPlan({ ...plan, features: updatedFeatures })
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updatedFeatures = plan.features.filter((_: string, i: number) => i !== index)
                      setPlan({ ...plan, features: updatedFeatures })
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
                  setPlan({ ...plan, features: [...plan.features, ""] })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSavePlan}>
            {isEditing ? "Save Changes" : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

