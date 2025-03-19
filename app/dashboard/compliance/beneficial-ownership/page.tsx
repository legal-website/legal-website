"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
  const [isTableChecked, setIsTableChecked] = useState(false)

  // Fetch owners when component mounts
  useEffect(() => {
    if (status === "authenticated") {
      checkTable()
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/compliance/beneficial-ownership")
    }
  }, [status, router])

  // Calculate total ownership percentage
  useEffect(() => {
    const total = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0)
    setTotalOwnership(total)
  }, [owners])

  const checkTable = async () => {
    try {
      const response = await fetch("/api/beneficial-ownership/check-table")
      const data = await response.json()

      if (data.tableExists) {
        setIsTableChecked(true)
        fetchOwners()
      } else {
        toast({
          title: "Database Setup Required",
          description: "The beneficial ownership table does not exist. Please contact an administrator.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error checking table:", error)
      toast({
        title: "Error",
        description: "Failed to check database setup. Please try again later.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const fetchOwners = async () => {
    setIsLoading(true)
    try {
      // First check if default owner exists
      const defaultResponse = await fetch("/api/beneficial-ownership/default")
      const defaultData = await defaultResponse.json()

      if (!defaultData.exists) {
        // Create default owner if it doesn't exist
        await fetch("/api/beneficial-ownership/default", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      }

      // Now fetch all owners
      const response = await fetch("/api/beneficial-ownership")
      const data = await response.json()

      if (data.owners) {
        setOwners(data.owners)
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

  const submitAddOwner = async () => {
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

    try {
      const response = await fetch("/api/beneficial-ownership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add owner")
      }

      // Refresh the owners list
      fetchOwners()
      setShowAddDialog(false)

      toast({
        title: "Owner Added",
        description: "Beneficial owner has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to add beneficial owner.",
        variant: "destructive",
      })
    }
  }

  const submitEditOwner = async () => {
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

    // Check minimum ownership rules for default owner
    if (currentOwner.isDefault) {
      const totalOwners = owners.length
      let minOwnership = 0

      if (totalOwners === 2) {
        minOwnership = 51 // If 2 owners, primary must have at least 51%
      } else if (totalOwners === 3) {
        minOwnership = 34 // If 3 owners, primary must have at least 34%
      } else if (totalOwners > 3) {
        minOwnership = 25 // If more than 3 owners, primary must have at least 25%
      }

      if (formData.ownershipPercentage < minOwnership) {
        toast({
          title: "Validation Error",
          description: `Primary owner must maintain at least ${minOwnership}% ownership with ${totalOwners} total owners.`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      const response = await fetch(`/api/beneficial-ownership/${currentOwner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update owner")
      }

      // Refresh the owners list
      fetchOwners()
      setShowEditDialog(false)

      toast({
        title: "Owner Updated",
        description: "Beneficial owner has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update beneficial owner.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteOwner = async () => {
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

    try {
      const response = await fetch(`/api/beneficial-ownership/${currentOwner.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete owner")
      }

      // Refresh the owners list
      fetchOwners()
      setShowDeleteDialog(false)

      toast({
        title: "Owner Deleted",
        description: "Beneficial owner has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete beneficial owner.",
        variant: "destructive",
      })
    }
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

  if (!isTableChecked) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Database Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The beneficial ownership table does not exist in the database.</p>
            <p className="mb-4">Please contact an administrator to set up the required database tables.</p>
            <Button onClick={checkTable}>Check Again</Button>
          </CardContent>
        </Card>
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
                {owners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No beneficial owners found. Add your first owner.
                    </TableCell>
                  </TableRow>
                ) : (
                  owners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.title}</TableCell>
                      <TableCell>{owner.ownershipPercentage}%</TableCell>
                      <TableCell>{formatDate(owner.dateAdded)}</TableCell>
                      <TableCell>{getStatusBadge(owner.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditOwner(owner)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOwner(owner)}
                            disabled={owner.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                disabled={currentOwner?.isDefault}
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
                disabled={currentOwner?.isDefault}
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
                  This is the primary owner. You can only change the ownership percentage.
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
    </div>
  )
}

