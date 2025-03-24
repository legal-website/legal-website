"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users,
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CouponType } from "@/lib/prisma-types"
import { formatCouponValue, getCouponStatus } from "@/lib/coupon"
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
import { MultiSelect } from "@/components/ui/multi-select"

// Define interfaces for type safety
interface Coupon {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  startDate: string
  endDate: string
  usageCount: number
  usageLimit: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  specificClient: boolean
  clientIds: string[] | null
  minimumAmount: number | null
  onePerCustomer: boolean
  newCustomersOnly: boolean
  status?: "Active" | "Scheduled" | "Expired"
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: CouponType.PERCENTAGE,
    value: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd"),
    usageLimit: "100",
    isActive: true,
    specificClient: false,
    clientIds: [] as string[],
    minimumAmount: "",
    onePerCustomer: false,
    newCustomersOnly: false,
  })

  // Fetch coupons on component mount
  useEffect(() => {
    fetchCoupons()
  }, [activeTab])

  // Fetch users when specificClient is true
  useEffect(() => {
    if (formData.specificClient && users.length === 0) {
      fetchUsers()
    }
  }, [formData.specificClient, users.length])

  const fetchCoupons = async () => {
    try {
      setLoading(true)

      let url = "/api/admin/coupons"
      if (activeTab !== "all") {
        url += `?status=${activeTab}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch coupons")
      }

      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast({
        title: "Error",
        description: "Failed to load coupons. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value as CouponType,
    })
  }

  const handleClientSelectChange = (selectedOptions: string[]) => {
    setFormData({
      ...formData,
      clientIds: selectedOptions,
    })
  }

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      type: CouponType.PERCENTAGE,
      value: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd"),
      usageLimit: "100",
      isActive: true,
      specificClient: false,
      clientIds: [],
      minimumAmount: "",
      onePerCustomer: false,
      newCustomersOnly: false,
    })
  }

  const handleCreateCoupon = async () => {
    try {
      // Validate form
      if (!formData.code || !formData.description || !formData.value || !formData.usageLimit) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (endDate <= startDate) {
        toast({
          title: "Invalid dates",
          description: "End date must be after start date.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          type: formData.type,
          value: Number.parseFloat(formData.value),
          startDate: formData.startDate,
          endDate: formData.endDate,
          usageLimit: Number.parseInt(formData.usageLimit),
          isActive: formData.isActive,
          specificClient: formData.specificClient,
          clientIds: formData.specificClient ? formData.clientIds : null,
          minimumAmount: formData.minimumAmount ? Number.parseFloat(formData.minimumAmount) : null,
          onePerCustomer: formData.onePerCustomer,
          newCustomersOnly: formData.newCustomersOnly,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create coupon")
      }

      const data = await response.json()

      toast({
        title: "Coupon created",
        description: `Coupon ${data.coupon.code} has been created successfully.`,
      })

      setShowCreateDialog(false)
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      console.error("Error creating coupon:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value.toString(),
      startDate: coupon.startDate.split("T")[0],
      endDate: coupon.endDate.split("T")[0],
      usageLimit: coupon.usageLimit.toString(),
      isActive: coupon.isActive,
      specificClient: coupon.specificClient,
      clientIds: coupon.clientIds || [],
      minimumAmount: coupon.minimumAmount ? coupon.minimumAmount.toString() : "",
      onePerCustomer: coupon.onePerCustomer,
      newCustomersOnly: coupon.newCustomersOnly,
    })
    setShowEditDialog(true)
  }

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return

    try {
      // Validate form
      if (!formData.code || !formData.description || !formData.value || !formData.usageLimit) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (endDate <= startDate) {
        toast({
          title: "Invalid dates",
          description: "End date must be after start date.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          type: formData.type,
          value: Number.parseFloat(formData.value),
          startDate: formData.startDate,
          endDate: formData.endDate,
          usageLimit: Number.parseInt(formData.usageLimit),
          isActive: formData.isActive,
          specificClient: formData.specificClient,
          clientIds: formData.specificClient ? formData.clientIds : null,
          minimumAmount: formData.minimumAmount ? Number.parseFloat(formData.minimumAmount) : null,
          onePerCustomer: formData.onePerCustomer,
          newCustomersOnly: formData.newCustomersOnly,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update coupon")
      }

      toast({
        title: "Coupon updated",
        description: `Coupon ${formData.code} has been updated successfully.`,
      })

      setShowEditDialog(false)
      setSelectedCoupon(null)
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      console.error("Error updating coupon:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowDeleteDialog(true)
  }

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete coupon")
      }

      toast({
        title: "Coupon deleted",
        description: `Coupon ${selectedCoupon.code} has been deleted successfully.`,
      })

      setShowDeleteDialog(false)
      setSelectedCoupon(null)
      fetchCoupons()
    } catch (error: any) {
      console.error("Error deleting coupon:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateCoupon = (coupon: Coupon) => {
    setFormData({
      code: `${coupon.code}_COPY`,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value.toString(),
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd"),
      usageLimit: coupon.usageLimit.toString(),
      isActive: true,
      specificClient: coupon.specificClient,
      clientIds: coupon.clientIds || [],
      minimumAmount: coupon.minimumAmount ? coupon.minimumAmount.toString() : "",
      onePerCustomer: coupon.onePerCustomer,
      newCustomersOnly: coupon.newCustomersOnly,
    })
    setShowCreateDialog(true)
  }

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage discount coupons for your clients</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coupons..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" onClick={fetchCoupons}>
            <Filter className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Coupons</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No coupons found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first coupon to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Coupon</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleEditCoupon(coupon)}
                  onDelete={() => handleDeleteClick(coupon)}
                  onDuplicate={() => handleDuplicateCoupon(coupon)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No active coupons found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create a new coupon or activate an existing one.</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Coupon</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleEditCoupon(coupon)}
                  onDelete={() => handleDeleteClick(coupon)}
                  onDuplicate={() => handleDuplicateCoupon(coupon)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled coupons found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Schedule a coupon for future use.</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Scheduled Coupon</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleEditCoupon(coupon)}
                  onDelete={() => handleDeleteClick(coupon)}
                  onDuplicate={() => handleDuplicateCoupon(coupon)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No expired coupons found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Expired coupons will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleEditCoupon(coupon)}
                  onDelete={() => handleDeleteClick(coupon)}
                  onDuplicate={() => handleDuplicateCoupon(coupon)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Coupon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>Create a new discount coupon for your clients.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Coupon Code
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. SUMMER25"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this coupon"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Discount Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CouponType.PERCENTAGE}>Percentage Discount</SelectItem>
                  <SelectItem value={CouponType.FIXED_AMOUNT}>Fixed Amount</SelectItem>
                  <SelectItem value={CouponType.FREE_SERVICE}>Free Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Discount Value
              </Label>
              <div className="col-span-3 flex items-center">
                <Input
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder={formData.type === CouponType.PERCENTAGE ? "e.g. 25" : "e.g. 10.99"}
                  className="flex-1"
                  type="number"
                  step={formData.type === CouponType.PERCENTAGE ? "1" : "0.01"}
                />
                <div className="ml-2 w-12 h-10 flex items-center justify-center border rounded-md">
                  {formData.type === CouponType.PERCENTAGE ? "%" : "$"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                type="date"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                type="date"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usageLimit" className="text-right">
                Usage Limit
              </Label>
              <Input
                id="usageLimit"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleInputChange}
                type="number"
                placeholder="e.g. 500"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minimumAmount" className="text-right">
                Minimum Amount
              </Label>
              <Input
                id="minimumAmount"
                name="minimumAmount"
                value={formData.minimumAmount}
                onChange={handleInputChange}
                type="number"
                step="0.01"
                placeholder="e.g. 50.00 (optional)"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Specific Clients</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="specificClient"
                  checked={formData.specificClient}
                  onCheckedChange={(checked) => handleCheckboxChange("specificClient", checked as boolean)}
                />
                <label htmlFor="specificClient" className="text-sm">
                  Limit this coupon to specific clients
                </label>
              </div>
            </div>

            {formData.specificClient && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Select Clients</Label>
                <div className="col-span-3">
                  {loadingUsers ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
                    <MultiSelect
                      options={users.map((user) => ({
                        label: `${user.name} (${user.email})`,
                        value: user.id,
                      }))}
                      selected={formData.clientIds}
                      onChange={handleClientSelectChange}
                      placeholder="Select clients..."
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Restrictions</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newCustomersOnly"
                    checked={formData.newCustomersOnly}
                    onCheckedChange={(checked) => handleCheckboxChange("newCustomersOnly", checked as boolean)}
                  />
                  <label htmlFor="newCustomersOnly" className="text-sm">
                    New customers only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onePerCustomer"
                    checked={formData.onePerCustomer}
                    onCheckedChange={(checked) => handleCheckboxChange("onePerCustomer", checked as boolean)}
                  />
                  <label htmlFor="onePerCustomer" className="text-sm">
                    One use per customer
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleCheckboxChange("isActive", checked as boolean)}
                />
                <label htmlFor="isActive" className="text-sm">
                  Coupon is active
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateCoupon} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Coupon"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Coupon Code
              </Label>
              <Input
                id="edit-code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. SUMMER25"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this coupon"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Discount Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CouponType.PERCENTAGE}>Percentage Discount</SelectItem>
                  <SelectItem value={CouponType.FIXED_AMOUNT}>Fixed Amount</SelectItem>
                  <SelectItem value={CouponType.FREE_SERVICE}>Free Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-value" className="text-right">
                Discount Value
              </Label>
              <div className="col-span-3 flex items-center">
                <Input
                  id="edit-value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder={formData.type === CouponType.PERCENTAGE ? "e.g. 25" : "e.g. 10.99"}
                  className="flex-1"
                  type="number"
                  step={formData.type === CouponType.PERCENTAGE ? "1" : "0.01"}
                />
                <div className="ml-2 w-12 h-10 flex items-center justify-center border rounded-md">
                  {formData.type === CouponType.PERCENTAGE ? "%" : "$"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="edit-startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                type="date"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="edit-endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                type="date"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-usageLimit" className="text-right">
                Usage Limit
              </Label>
              <Input
                id="edit-usageLimit"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleInputChange}
                type="number"
                placeholder="e.g. 500"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-minimumAmount" className="text-right">
                Minimum Amount
              </Label>
              <Input
                id="edit-minimumAmount"
                name="minimumAmount"
                value={formData.minimumAmount}
                onChange={handleInputChange}
                type="number"
                step="0.01"
                placeholder="e.g. 50.00 (optional)"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Specific Clients</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-specificClient"
                  checked={formData.specificClient}
                  onCheckedChange={(checked) => handleCheckboxChange("specificClient", checked as boolean)}
                />
                <label htmlFor="edit-specificClient" className="text-sm">
                  Limit this coupon to specific clients
                </label>
              </div>
            </div>

            {formData.specificClient && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Select Clients</Label>
                <div className="col-span-3">
                  {loadingUsers ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
                    <MultiSelect
                      options={users.map((user) => ({
                        label: `${user.name} (${user.email})`,
                        value: user.id,
                      }))}
                      selected={formData.clientIds}
                      onChange={handleClientSelectChange}
                      placeholder="Select clients..."
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Restrictions</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-newCustomersOnly"
                    checked={formData.newCustomersOnly}
                    onCheckedChange={(checked) => handleCheckboxChange("newCustomersOnly", checked as boolean)}
                  />
                  <label htmlFor="edit-newCustomersOnly" className="text-sm">
                    New customers only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-onePerCustomer"
                    checked={formData.onePerCustomer}
                    onCheckedChange={(checked) => handleCheckboxChange("onePerCustomer", checked as boolean)}
                  />
                  <label htmlFor="edit-onePerCustomer" className="text-sm">
                    One use per customer
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleCheckboxChange("isActive", checked as boolean)}
                />
                <label htmlFor="edit-isActive" className="text-sm">
                  Coupon is active
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleUpdateCoupon} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Coupon"
              )}
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
              This will permanently delete the coupon "{selectedCoupon?.code}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoupon} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  coupon: Coupon
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "Scheduled":
        return <Clock className="h-4 w-4 mr-1" />
      case "Expired":
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  // Calculate status if not provided
  const status = coupon.status || getCouponStatus(coupon.isActive, new Date(coupon.startDate), new Date(coupon.endDate))

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center mb-1">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded mr-3">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{coupon.code}</h3>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  {status}
                </span>
                {coupon.specificClient && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    Specific Clients
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{coupon.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Discount</p>
          <div className="flex items-center">
            <Percent className="h-4 w-4 mr-1 text-gray-400" />
            <span>{formatCouponValue(coupon.type, coupon.value)}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Valid Period</p>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            <span>
              {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Usage</p>
          <div className="flex items-center">
            <span>
              {coupon.usageCount} / {coupon.usageLimit}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Restrictions</p>
          <div className="flex flex-wrap gap-1">
            {coupon.onePerCustomer && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">One per customer</span>
            )}
            {coupon.newCustomersOnly && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">New customers only</span>
            )}
            {coupon.minimumAmount && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                Min: ${coupon.minimumAmount}
              </span>
            )}
            {!coupon.onePerCustomer && !coupon.newCustomersOnly && !coupon.minimumAmount && (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

