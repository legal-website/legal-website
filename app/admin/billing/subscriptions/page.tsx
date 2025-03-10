"use client"

import { useState, useEffect } from "react"
import { Plus, DollarSign, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/app/admin/components/data-table"
import { columns } from "@/app/admin/components/columns"
import { PlanDialog } from "@/app/admin/components/plan-dialog"
import { StateFeesDialog } from "@/app/admin/components/state-fees-dialog"
import { toast } from "@/components/ui/use-toast"

// Define proper types for our data structures
interface PricingPlan {
  id: string | number
  name: string
  price: number
  displayPrice?: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended?: boolean
  hasAssistBadge?: boolean
  includesPackage?: string
}

interface PricingData {
  plans: PricingPlan[]
  stateFilingFees: Record<string, number>
  stateDiscounts: Record<string, number>
  stateDescriptions: Record<string, string>
}

export default function SubscriptionsPage() {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showStateFeesDialog, setShowStateFeesDialog] = useState(false)
  // Change the editingPlan state to use the PricingPlan type instead of null
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  // Update the useState call to use this type
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("plans")

  // Fetch pricing data
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
        description: "Failed to load pricing information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
  }, [])

  // Update the tableData mapping to properly handle the types
  const tableData = pricingData.plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    frequency: plan.billingCycle === "one-time" ? "One-time" : plan.billingCycle === "monthly" ? "Monthly" : "Annual",
    features: plan.features,
    recommended: plan.isRecommended || false,
    assistBadge: plan.hasAssistBadge || false,
    includesPackage: plan.includesPackage || "",
  }))

  // Update the handleEditPlan function to properly type the plan parameter
  const handleEditPlan = (plan: any) => {
    // Find the complete plan data from pricingData using the ID
    const planToEdit = pricingData.plans.find((p) => p.id === plan.id)

    if (planToEdit) {
      // Set the complete plan data for editing
      setEditingPlan({ ...planToEdit })
      setShowPlanDialog(true)
    } else {
      toast({
        title: "Error",
        description: "Could not find the plan to edit.",
        variant: "destructive",
      })
    }
  }

  // Add type annotation for the handleDeletePlan function
  const handleDeletePlan = async (planId: string | number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      // Filter out the plan to delete
      const updatedPlans = pricingData.plans.filter((plan) => plan.id !== planId)

      // Update the API
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...pricingData,
          plans: updatedPlans,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete plan")
      }

      // Refresh data
      fetchPricingData()

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    // Add type annotation for the row parameter in the cell function
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
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
    <div className="container mx-auto py-10 mb-40 px-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowStateFeesDialog(true)}>
            <Map className="h-4 w-4 mr-2" />
            Manage State Fees
          </Button>
          <Button
            onClick={() => {
              setEditingPlan(null)
              setShowPlanDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>
                Manage your subscription plans. Changes will be immediately reflected on the pricing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <DataTable columns={enhancedColumns} data={tableData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12.5%</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <PlanDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} editingPlan={editingPlan} />

      {/* State Fees Dialog */}
      <StateFeesDialog open={showStateFeesDialog} onOpenChange={setShowStateFeesDialog} />
    </div>
  )
}

