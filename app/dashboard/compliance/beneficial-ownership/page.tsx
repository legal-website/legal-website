"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Edit, Plus, Trash2, Users } from "lucide-react"
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

import type React from "react"

import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { FileText, Info, PenTool, CalendarIcon } from "lucide-react"

interface Owner {
  id: string
  name: string
  title: string
  ownershipPercentage: number
  dateAdded: string
  status: "pending" | "reported"
  isDefault?: boolean
}

export default function BeneficialOwnershipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [owners, setOwners] = useState<Owner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    ownershipPercentage: 0,
  })
  const [totalOwnership, setTotalOwnership] = useState(0)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [amendmentText, setAmendmentText] = useState("")
  const complianceScore = 65 // Example score

  // Fetch owners when component mounts
  useEffect(() => {
    if (status === "authenticated") {
      fetchOwners()
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/compliance/beneficial-ownership")
    }
  }, [status, router])

  // Calculate total ownership percentage
  useEffect(() => {
    const total = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0)
    setTotalOwnership(total)
  }, [owners])

  const fetchOwners = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate with a timeout and default data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if we already have owners
      if (owners.length === 0) {
        // Add the current user as the default owner with 100% ownership
        const defaultOwner: Owner = {
          id: "default-owner",
          name: session?.user?.name || "Current User",
          title: "CEO",
          ownershipPercentage: 100,
          dateAdded: new Date().toISOString(),
          status: "reported",
          isDefault: true,
        }
        setOwners([defaultOwner])
      }
    } catch (error) {
      console.error("Error fetching owners:", error)
      toast({
        title: "Error",
        description: "Failed to load beneficial owners. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "ownershipPercentage") {
      // Ensure ownership percentage is a number and within valid range
      const numValue = Number.parseFloat(value)
      if (isNaN(numValue) || numValue < 0 || numValue > 100) return

      setFormData({ ...formData, [name]: numValue })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleAddOwner = () => {
    // Reset form data
    setFormData({
      name: "",
      title: "",
      ownershipPercentage: 0,
    })
    setShowAddDialog(true)
  }

  const handleEditOwner = (owner: Owner) => {
    setCurrentOwner(owner)
    setFormData({
      name: owner.name,
      title: owner.title,
      ownershipPercentage: owner.ownershipPercentage,
    })
    setShowEditDialog(true)
  }

  const handleDeleteOwner = (owner: Owner) => {
    setCurrentOwner(owner)
    setShowDeleteDialog(true)
  }

  const submitAddOwner = () => {
    // Validate form data
    if (!formData.name || !formData.title || formData.ownershipPercentage <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      })
      return
    }

    // Check if total ownership would exceed 100%
    const newTotal = totalOwnership + formData.ownershipPercentage
    if (newTotal > 100) {
      toast({
        title: "Validation Error",
        description: "Total ownership percentage cannot exceed 100%.",
        variant: "destructive",
      })
      return
    }

    // Create new owner
    const newOwner: Owner = {
      id: `owner-${Date.now()}`,
      name: formData.name,
      title: formData.title,
      ownershipPercentage: formData.ownershipPercentage,
      dateAdded: new Date().toISOString(),
      status: "pending",
    }

    setOwners([...owners, newOwner])
    setShowAddDialog(false)

    toast({
      title: "Owner Added",
      description: "Beneficial owner has been added successfully.",
    })
  }

  const submitEditOwner = () => {
    if (!currentOwner) return

    // Validate form data
    if (!formData.name || !formData.title || formData.ownershipPercentage <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      })
      return
    }

    // Calculate new total ownership excluding current owner
    const otherOwnersTotal = owners.reduce(
      (sum, owner) => (owner.id === currentOwner.id ? sum : sum + owner.ownershipPercentage),
      0,
    )

    const newTotal = otherOwnersTotal + formData.ownershipPercentage
    if (newTotal > 100) {
      toast({
        title: "Validation Error",
        description: "Total ownership percentage cannot exceed 100%.",
        variant: "destructive",
      })
      return
    }

    // Update owner
    const updatedOwners = owners.map((owner) => {
      if (owner.id === currentOwner.id) {
        return {
          ...owner,
          name: formData.name,
          title: formData.title,
          ownershipPercentage: formData.ownershipPercentage,
          status: owner.isDefault ? ("reported" as const) : ("pending" as const), // Use type assertion
        }
      }
      return owner
    })

    setOwners(updatedOwners)
    setShowEditDialog(false)

    toast({
      title: "Owner Updated",
      description: "Beneficial owner has been updated successfully.",
    })
  }

  const confirmDeleteOwner = () => {
    if (!currentOwner) return

    // Don't allow deleting the default owner
    if (currentOwner.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "The primary owner cannot be deleted.",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
      return
    }

    const updatedOwners = owners.filter((owner) => owner.id !== currentOwner.id)
    setOwners(updatedOwners)
    setShowDeleteDialog(false)

    toast({
      title: "Owner Deleted",
      description: "Beneficial owner has been deleted successfully.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === "reported") {
      return <Badge className="bg-green-100 text-green-800">Reported</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  const handleAmendmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle amendment submission
    console.log("Amendment submitted:", amendmentText)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading ownership information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Beneficial Ownership</h1>
          <p className="text-muted-foreground mt-1">Manage your company's beneficial ownership information</p>
        </div>
        <Button onClick={handleAddOwner} className="flex items-center gap-2">
          <Plus size={16} />
          Add Owner
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ownership Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Ownership Allocated</span>
                <span className="text-sm font-bold">{totalOwnership}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${totalOwnership}%` }}></div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {totalOwnership < 100 ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>{100 - totalOwnership}% of ownership remains unallocated</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>All ownership has been allocated</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Owners</p>
                  <p className="text-2xl font-bold">{owners.length}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending Updates</p>
                  <p className="text-2xl font-bold">{owners.filter((owner) => owner.status === "pending").length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beneficial Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Owners</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reported">Reported</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <OwnerTable
                owners={owners}
                onEdit={handleEditOwner}
                onDelete={handleDeleteOwner}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="pending">
              <OwnerTable
                owners={owners.filter((owner) => owner.status === "pending")}
                onEdit={handleEditOwner}
                onDelete={handleDeleteOwner}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="reported">
              <OwnerTable
                owners={owners.filter((owner) => owner.status === "reported")}
                onEdit={handleEditOwner}
                onDelete={handleDeleteOwner}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Owner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Beneficial Owner</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="title">Title/Position</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter title or position"
              />
            </div>
            <div>
              <Label htmlFor="ownershipPercentage">Ownership Percentage (%)</Label>
              <Input
                id="ownershipPercentage"
                name="ownershipPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.ownershipPercentage}
                onChange={handleInputChange}
                placeholder="Enter ownership percentage"
              />
              <p className="text-sm text-muted-foreground mt-1">Available: {100 - totalOwnership}%</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAddOwner}>Add Owner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Owner Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Beneficial Owner</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-title">Title/Position</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter title or position"
              />
            </div>
            <div>
              <Label htmlFor="edit-ownershipPercentage">Ownership Percentage (%)</Label>
              <Input
                id="edit-ownershipPercentage"
                name="ownershipPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.ownershipPercentage}
                onChange={handleInputChange}
                placeholder="Enter ownership percentage"
              />
              {currentOwner && (
                <p className="text-sm text-muted-foreground mt-1">
                  Available: {100 - totalOwnership + currentOwner.ownershipPercentage}%
                </p>
              )}
            </div>
            {currentOwner?.isDefault && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  This is the primary owner. Status will remain as "Reported" after editing.
                </p>
              </div>
            )}
            {!currentOwner?.isDefault && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  Editing this owner will change the status to "Pending" until approved by an administrator.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditOwner}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Owner Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Beneficial Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this beneficial owner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOwner} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Compliance Score */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <Progress value={complianceScore} className="h-24 w-24" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{complianceScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Compliance Score</h3>
            <p className="text-gray-600">Your business is maintaining good compliance standards.</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Amendments */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PenTool className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Amendments</h3>
                  <p className="text-sm text-gray-600">Submit company amendments</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Amendment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAmendmentSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amendment-type">Amendment Type</Label>
                <Input id="amendment-type" placeholder="Select amendment type" />
              </div>
              <div>
                <Label htmlFor="amendment-text">Amendment Details</Label>
                <Textarea
                  id="amendment-text"
                  placeholder="Describe your amendment..."
                  value={amendmentText}
                  onChange={(e) => setAmendmentText(e.target.value)}
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Amendment
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Annual Reports */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Annual Reports</h3>
                  <p className="text-sm text-gray-600">View and file annual reports</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Annual Reports Calendar</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Upcoming Deadlines</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Annual Report Due: July 15, 2024
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-500" />
                    Tax Filing Deadline: September 30, 2024
                  </li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Beneficial Ownership */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Beneficial Ownership</h3>
              <p className="text-sm text-gray-600">Manage ownership information</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Compliance Status</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Annual Report</span>
              </div>
              <span className="text-sm text-gray-600">Filed on Mar 15, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Business License</span>
              </div>
              <span className="text-sm text-gray-600">Valid until Dec 31, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>Tax Filings</span>
              </div>
              <span className="text-sm text-yellow-600">Due in 45 days</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Documents */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { name: "Annual Report 2024", date: "Mar 15, 2024", type: "PDF" },
              { name: "Amendment Filing", date: "Feb 28, 2024", type: "PDF" },
              { name: "Meeting Minutes", date: "Jan 15, 2024", type: "DOC" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.date}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Owner Table Component
function OwnerTable({
  owners,
  onEdit,
  onDelete,
  formatDate,
  getStatusBadge,
}: {
  owners: Owner[]
  onEdit: (owner: Owner) => void
  onDelete: (owner: Owner) => void
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => React.ReactNode
}) {
  if (owners.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium mb-2">No owners found</h3>
        <p className="text-muted-foreground">No beneficial owners match the current filter.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Ownership %</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id}>
              <TableCell className="font-medium">{owner.name}</TableCell>
              <TableCell>{owner.title}</TableCell>
              <TableCell>{owner.ownershipPercentage}%</TableCell>
              <TableCell>{formatDate(owner.dateAdded)}</TableCell>
              <TableCell>{getStatusBadge(owner.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(owner)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(owner)} disabled={owner.isDefault}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

