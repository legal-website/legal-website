"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'

export default function BeneficialOwnershipPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [currentOwner, setCurrentOwner] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    ownershipPercentage: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session) {
      return
    }

    // First check/create default owner
    fetch("/api/beneficial-ownership/default")
      .then((res) => res.json())
      .then((data) => {
        if (data.isNew) {
          toast({
            title: "Default owner created",
            description: "You have been set as the primary owner with 100% ownership.",
          })
        }

        // Then fetch all owners
        fetchOwners()
      })
      .catch((error) => {
        console.error("Error checking default owner:", error)
        toast({
          title: "Error",
          description: "Failed to initialize beneficial ownership data.",
          variant: "destructive",
        })
        setLoading(false)
      })
  }, [session])

  const fetchOwners = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/beneficial-ownership")
      const data = await res.json()

      if (data.owners) {
        setOwners(data.owners)
      }
    } catch (error) {
      console.error("Error fetching owners:", error)
      toast({
        title: "Error",
        description: "Failed to fetch beneficial owners.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault()

    await submitAddOwner()
  }

  const submitAddOwner = async () => {
    // Validate form data
    if (!formData.name || !formData.title || !formData.ownershipPercentage || parseFloat(formData.ownershipPercentage) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      })
      return
    }

    // Get the CEO (default owner)
    const ceoOwner = owners.find((o) => o.isDefault)
    if (!ceoOwner) {
      toast({
        title: "Error",
        description: "Default owner not found. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    // Calculate new total ownership
    const newOwnerPercentage = Number.parseFloat(formData.ownershipPercentage)
    const otherOwnersTotal = owners.reduce((sum, owner) => sum + (owner.isDefault ? 0 : owner.ownershipPercentage), 0)
    const newTotal = otherOwnersTotal + newOwnerPercentage

    // Check if total ownership would exceed 100%
    if (newTotal + ceoOwner.ownershipPercentage > 100) {
      toast({
        title: "Validation Error",
        description: "Total ownership percentage cannot exceed 100%.",
        variant: "destructive",
      })
      return
    }

    // Enforce maximum allocation based on number of existing owners
    const maxAllocation = owners.length === 0 ? 48 : owners.length === 1 ? 33 : 25
    if (newOwnerPercentage > maxAllocation) {
      toast({
        title: "Validation Error",
        description: `You cannot allocate more than ${maxAllocation}% to this owner.`,
        variant: "destructive",
      })
      return
    }

    // Ensure CEO maintains highest percentage
    const newCeoPercentage = 100 - (otherOwnersTotal + newOwnerPercentage)
    const highestNonCeoPercentage = Math.max(
      ...owners.filter((o) => !o.isDefault).map((o) => o.ownershipPercentage),
      newOwnerPercentage,
    )

    if (newCeoPercentage <= highestNonCeoPercentage) {
      toast({
        title: "Validation Error",
        description: "The CEO must maintain the highest ownership percentage.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch("/api/beneficial-ownership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to add owner")
      }

      toast({
        title: "Success",
        description: "Beneficial owner added successfully.",
      })

      setOpenAddDialog(false)
      setFormData({
        name: "",
        title: "",
        ownershipPercentage: "",
      })

      fetchOwners()
    } catch (error) {
      console.error("Error adding owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditOwner = async (e: React.FormEvent) => {
    e.preventDefault()

    await submitEditOwner()
  }

  const submitEditOwner = async () => {
    if (!currentOwner) return

    // Validate form data
    if (!formData.name || !formData.title || !formData.ownershipPercentage || parseFloat(formData.ownershipPercentage) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      })
      return
    }

    const newOwnerPercentage = Number.parseFloat(formData.ownershipPercentage)

    // If editing the CEO (default owner)
    if (currentOwner.isDefault) {
      // Calculate total of other owners
      const otherOwnersTotal = owners.reduce((sum, owner) => sum + (owner.isDefault ? 0 : owner.ownershipPercentage), 0)

      // Check if total would exceed 100%
      if (newOwnerPercentage + otherOwnersTotal > 100) {
        toast({
          title: "Validation Error",
          description: "Total ownership percentage cannot exceed 100%.",
          variant: "destructive",
        })
        return
      }

      // Ensure CEO maintains highest percentage
      const highestNonCeoPercentage = Math.max(
        ...owners.filter((o) => !o.isDefault).map((o) => o.ownershipPercentage),
        0,
      )

      if (newOwnerPercentage <= highestNonCeoPercentage) {
        toast({
          title: "Validation Error",
          description: "As CEO, you must maintain the highest ownership percentage.",
          variant: "destructive",
        })
        return
      }
    } else {
      // If editing a non-CEO owner

      // Calculate new total ownership excluding current owner
      const otherOwnersTotal = owners.reduce(
        (sum, owner) => (owner.id === currentOwner.id ? sum : sum + owner.ownershipPercentage),
        0,
      )

      const newTotal = otherOwnersTotal + newOwnerPercentage
      if (newTotal > 100) {
        toast({
          title: "Validation Error",
          description: "Total ownership percentage cannot exceed 100%.",
          variant: "destructive",
        })
        return
      }

      // Get the CEO owner
      const ceoOwner = owners.find((o) => o.isDefault)
      if (!ceoOwner) {
        toast({
          title: "Error",
          description: "Default owner not found. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      // Calculate new CEO percentage after this change
      const newCeoPercentage = ceoOwner.ownershipPercentage - (newOwnerPercentage - currentOwner.ownershipPercentage)

      // Ensure CEO maintains highest percentage
      const highestNonCeoPercentage = Math.max(
        ...owners.filter((o) => !o.isDefault && o.id !== currentOwner.id).map((o) => o.ownershipPercentage),
        newOwnerPercentage,
      )

      if (newCeoPercentage <= highestNonCeoPercentage) {
        toast({
          title: "Validation Error",
          description: "The CEO must maintain the highest ownership percentage.",
          variant: "destructive",
        })
        return
      }

      // Enforce maximum allocation based on number of existing owners
      const maxAllocation = owners.length <= 2 ? 48 : owners.length === 3 ? 33 : 25
      if (newOwnerPercentage > maxAllocation) {
        toast({
          title: "Validation Error",
          description: `You cannot allocate more than ${maxAllocation}% to this owner.`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setSubmitting(true)

      const res = await fetch(`/api/beneficial-ownership/${currentOwner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update owner")
      }

      toast({
        title: "Success",
        description: "Beneficial owner updated successfully.",
      })

      setOpenEditDialog(false)
      setCurrentOwner(null)

      fetchOwners()
    } catch (error) {
      console.error("Error updating owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOwner = async () => {
    if (!currentOwner) return

    try {
      setSubmitting(true)

      const res = await fetch(`/api/beneficial-ownership/${currentOwner.id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete owner")
      }

      toast({
        title: "Success",
        description: "Beneficial owner deleted successfully.",
      })

      setOpenDeleteDialog(false)
      setCurrentOwner(null)

      fetchOwners()
    } catch (error) {
      console.error("Error deleting owner:", error)
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (owner: any) => {
    setCurrentOwner(owner)
    setFormData({
      name: owner.name,
      title: owner.isDefault ? "CEO" : owner.title,
      ownershipPercentage: owner.ownershipPercentage.toString(),
    })
    setOpenEditDialog(true)
  }

  const openDelete = (owner: any) => {
    setCurrentOwner(owner)
    setOpenDeleteDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "reported":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Reported
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading beneficial ownership data...</span>
      </div>
    )
  }

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Beneficial Ownership</CardTitle>
          <CardDescription>
            Manage your company's beneficial ownership information. All changes require approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Owner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Beneficial Owner</DialogTitle>
                  <DialogDescription>
                    Add a new beneficial owner to your company. The total ownership percentage cannot exceed 100%.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOwner}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownershipPercentage">Ownership Percentage (%)</Label>
                      <Input
                        id="ownershipPercentage"
                        name="ownershipPercentage"
                        type="number"
                        min="0.01"
                        max={owners.length === 0 ? 48 : owners.length === 1 ? 33 : 25}
                        value={formData.ownershipPercentage}
                        onChange={handleInputChange}
                        placeholder="Enter ownership percentage"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: {100 - (owners.find((o) => o.isDefault)?.ownershipPercentage || 0)}%
                      </p>
                      {owners.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          You can allocate up to 48% to this owner. The CEO must maintain at least 52% ownership.
                        </p>
                      )}
                      {owners.length === 1 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Recommended split for 3 owners: 34% (CEO), 33% (Owner 1), 33% (New Owner).
                        </p>
                      )}
                      {owners.length >= 2 && (
                        <p className="text-xs text-amber-600 mt-1">
                          The CEO must maintain the highest ownership percentage.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Add Owner"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableCaption>List of beneficial owners for your company.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Ownership %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No beneficial owners found.
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="font-medium">
                      {owner.name}
                      {owner.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Primary
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{owner.title}</TableCell>
                    <TableCell>{owner.ownershipPercentage}%</TableCell>
                    <TableCell>{getStatusBadge(owner.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(owner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!owner.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => openDelete(owner)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Note: Changes to beneficial ownership require approval and will be marked as pending until reviewed.
          </p>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Beneficial Owner</DialogTitle>
            <DialogDescription>
              {currentOwner?.isDefault
                ? "You can only update the ownership percentage of the primary owner."
                : "Update the beneficial owner's information."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditOwner}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  disabled={currentOwner?.isDefault}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  disabled={currentOwner?.isDefault}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-ownershipPercentage">Ownership Percentage (%)</Label>
                <Input
                  id="edit-ownershipPercentage"
                  name="ownershipPercentage"
                  type="number"
                  min="0.01"
                  max={currentOwner?.isDefault ? 100 : owners.length <= 2 ? 48 : owners.length === 3 ? 33 : 25}
                  value={formData.ownershipPercentage}
                  onChange={handleInputChange}
                  placeholder="Enter ownership percentage"
                />
                {currentOwner && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentOwner.isDefault
                      ? `As CEO, you must maintain the highest ownership percentage.`
                      : `Available: ${100 - totalOwnership + currentOwner.ownershipPercentage}%`}
                  </p>
                )}
                {!currentOwner?.isDefault && owners.length === 2 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Recommended split for 2 owners: 52% (CEO), 48% (This Owner).
                  </p>
                )}
                {!currentOwner?.isDefault && owners.length === 3 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Recommended split for 3 owners: 34% (CEO), 33% (Owner 1), 33% (Owner 2).
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Owner"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the beneficial owner. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOwner}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
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
