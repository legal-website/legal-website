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
  RefreshCw,
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
import PricingCards from "@/components/pricing"

// Define the SubscriptionPlan type
interface SubscriptionPlan {
  id: number
  name: string
  price: string
  billingCycle: "monthly" | "annual"
  features: string[]
  activeSubscribers: number
  growth: string
  trend: "up" | "down"
  revenue: string
}

// Define types for pricing data
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

// Define customer subscription type
interface CustomerSubscription {
  id: string
  customer: string
  email: string
  plan: string
  price: string
  startDate: string
  nextBillingDate: string
  status: "Active" | "Past Due" | "Canceled"
  paymentMethod: string
  cancellationDate?: string
  cancellationReason?: string
}

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
  const [loading, setLoading] = useState(false)
  const [pricingData, setPricingData] = useState<PricingData>({
    plans: [],
    stateFilingFees: {},
    stateDiscounts: {},
    stateDescriptions: {},
  })
  const { toast } = useToast()

  // Sample subscription plans data
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
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
  ])

  // Sample customer subscriptions data
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([
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
  ])

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
        // Use default data if API fails
        setPricingData({
          plans: [
            {
              id: 1,
              name: "Basic",
              price: 99,
              description: "Perfect for small businesses just getting started",
              features: ["Business name search", "Articles of organization", "Operating agreement"],
              billingCycle: "one-time",
            },
            {
              id: 2,
              name: "Standard",
              price: 199,
              description: "Most popular option for new businesses",
              features: [
                "Everything in Basic",
                "EIN application",
                "Banking resolution",
                "1 year registered agent service",
              ],
              isRecommended: true,
              billingCycle: "one-time",
            },
            {
              id: 3,
              name: "Premium",
              price: 299,
              description: "Complete solution for serious entrepreneurs",
              features: [
                "Everything in Standard",
                "Expedited filing",
                "Business license package",
                "2 years registered agent service",
              ],
              hasAssistBadge: true,
              billingCycle: "one-time",
            },
          ],
          stateFilingFees: {
            Alabama: 230,
            Alaska: 250,
            Arizona: 50,
            Arkansas: 45,
            California: 70,
            Colorado: 50,
            Connecticut: 120,
            Delaware: 90,
            Florida: 125,
            Georgia: 100,
            Hawaii: 50,
            Idaho: 100,
            Illinois: 150,
            Indiana: 95,
            Iowa: 50,
            Kansas: 160,
            Kentucky: 40,
            Louisiana: 100,
            Maine: 175,
            Maryland: 100,
            Massachusetts: 500,
            Michigan: 50,
            Minnesota: 135,
            Mississippi: 50,
            Missouri: 50,
            Montana: 70,
            Nebraska: 105,
            Nevada: 425,
            "New Hampshire": 100,
            "New Jersey": 125,
            "New Mexico": 50,
            "New York": 200,
            "North Carolina": 125,
            "North Dakota": 135,
            Ohio: 99,
            Oklahoma: 100,
            Oregon: 100,
            Pennsylvania: 125,
            "Rhode Island": 150,
            "South Carolina": 110,
            "South Dakota": 150,
            Tennessee: 300,
            Texas: 300,
            Utah: 54,
            Vermont: 125,
            Virginia: 100,
            Washington: 180,
            "West Virginia": 100,
            Wisconsin: 130,
            Wyoming: 100,
            "District of Columbia": 99,
          },
          stateDiscounts: {
            "New Mexico": 40,
            Wyoming: 80,
            Nevada: 325,
            Delaware: 70,
            "South Dakota": 120,
          },
          stateDescriptions: {
            Alabama: "Annual Report: $50 (10th April)",
            Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
            Arizona: "Annual Report: $0 (No annual report required)",
            Arkansas: "Annual Report: $150 (1st May)",
            California: "Annual Report: $800 minimum tax + $20 filing fee (15th day of 4th month)",
            Colorado: "Annual Report: $10 (end of month of formation)",
            Connecticut: "Annual Report: $80 (anniversary of formation)",
            Delaware: "Annual Report: $300 + franchise tax (1st June)",
            Florida: "Annual Report: $138.75 (1st May)",
            Georgia: "Annual Report: $50 (1st April)",
            Hawaii: "Annual Report: $15 (end of quarter of formation)",
            Idaho: "Annual Report: $0 (end of month of formation)",
            Illinois: "Annual Report: $75 (first day of anniversary month)",
            Indiana: "Biennial Report: $32 (anniversary month of formation)",
            Iowa: "Biennial Report: $60 (1st April)",
            Kansas: "Annual Report: $55 (15th day of 4th month after fiscal year end)",
            Kentucky: "Annual Report: $15 (30th June)",
            Louisiana: "Annual Report: $35 (anniversary of formation)",
            Maine: "Annual Report: $85 (1st June)",
            Maryland: "Annual Report: $300 (15th April)",
            Massachusetts: "Annual Report: $500 (anniversary date)",
            Michigan: "Annual Report: $25 (15th Feb)",
            Minnesota: "Annual Report: $0 (31st Dec)",
            Mississippi: "Annual Report: $0 (15th April)",
            Missouri: "Annual Report: $0 (No annual report required)",
            Montana: "Annual Report: $20 (15th April)",
            Nebraska: "Biennial Report: $10 (1st April)",
            Nevada: "Annual List: $150 + $200 business license fee (last day of month of formation)",
            "New Hampshire": "Annual Report: $100 (1st April)",
            "New Jersey": "Annual Report: $75 (last day of anniversary month)",
            "New Mexico": "Annual Report: $0 (No annual report required)",
            "New York": "Biennial Statement: $9 (anniversary month)",
            "North Carolina": "Annual Report: $200 (15th April)",
            "North Dakota": "Annual Report: $50 (1st Nov)",
            Ohio: "Biennial Report: $0 (No report required)",
            Oklahoma: "Annual Report: $25 (anniversary date)",
            Oregon: "Annual Report: $100 (anniversary date)",
            Pennsylvania: "Decennial Report: $70 (every 10 years)",
            "Rhode Island": "Annual Report: $50 (1st Nov)",
            "South Carolina": "Annual Report: $0 (No annual report required)",
            "South Dakota": "Annual Report: $50 (1st anniversary month)",
            Tennessee: "Annual Report: $300 min (1st day of 4th month after fiscal year end)",
            Texas: "Annual Report: $0 (15th May)",
            Utah: "Annual Report: $18 (anniversary month)",
            Vermont: "Annual Report: $35 (anniversary quarter)",
            Virginia: "Annual Report: $50 (last day of month when formed)",
            Washington: "Annual Report: $60 (end of anniversary month)",
            "West Virginia": "Annual Report: $25 (1st July)",
            Wisconsin: "Annual Report: $25 (end of quarter of formation)",
            Wyoming: "Annual Report: $60 min (first day of anniversary month)",
            "District of Columbia": "Biennial Report: $300 (1st April)",
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPricingData()
  }, [])

  // Filter subscriptions based on search and active tab
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

  // Handle editing a plan
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setIsEditing(true)
    setShowPlanDialog(true)
  }

  // Handle deleting a plan
  const handleDeletePlan = (planId: number) => {
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove the plan from the local state
      setSubscriptionPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== planToDelete.id))

      toast({
        title: "Plan deleted",
        description: `${planToDelete.name} plan has been deleted successfully.`,
      })

      // Close the dialog
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
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
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you would send the updated pricing data to your API
      await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricingData),
      })

      toast({
        title: "Changes saved",
        description: "Pricing data has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pricing changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update a pricing plan
  const updatePricingPlan = (index: number, field: keyof PricingTier, value: any) => {
    setPricingData((prev) => {
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
    setPricingData((prev) => ({
      ...prev,
      stateFilingFees: {
        ...prev.stateFilingFees,
        [state]: value,
      },
    }))
  }

  // Update a state discount
  const updateStateDiscount = (state: string, value: number) => {
    setPricingData((prev) => ({
      ...prev,
      stateDiscounts: {
        ...prev.stateDiscounts,
        [state]: value,
      },
    }))
  }

  // Update a state description
  const updateStateDescription = (state: string, value: string) => {
    setPricingData((prev) => ({
      ...prev,
      stateDescriptions: {
        ...prev.stateDescriptions,
        [state]: value,
      },
    }))
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
              setEditingPlan(null)
              setIsEditing(false)
              setShowPlanDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
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
                  value={editingPlan?.price ? editingPlan.price.replace("$", "") : ""}
                  onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, price: `$${e.target.value}` } : null))}
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
              </div>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                if (isEditing && editingPlan) {
                  // Update existing plan
                  setSubscriptionPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? editingPlan : p)))
                } else if (editingPlan) {
                  // Add new plan
                  const newPlan = {
                    ...editingPlan,
                    id: Math.max(...subscriptionPlans.map((p) => p.id)) + 1,
                    activeSubscribers: 0,
                    growth: "0%",
                    trend: "up" as const,
                    revenue: "$0.00",
                  }
                  setSubscriptionPlans((prev) => [...prev, newPlan])
                }
                setShowPlanDialog(false)
              }}
            >
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
  onDelete: (id: number) => void
}) {
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

