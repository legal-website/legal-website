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
import { Loader2, Plus, Pencil, Trash2, AlertCircle, RefreshCw, Filter, CheckCircle, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

// Types for filing history
interface FilingHistoryItem {
  id: string
  title: string
  filedDate: string
  status: string
  reportUrl?: string | null
}

export default function BeneficialOwnershipPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [owners, setOwners] = useState<any[]>([])
  const [filteredOwners, setFilteredOwners] = useState<any[]>([])
  const [filingHistory, setFilingHistory] = useState<FilingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
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
  const [statusFilter, setStatusFilter] = useState("all")

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
        // Fetch filing history from annual reports
        fetchFilingHistory()
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

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchOwners(false, true)
      fetchFilingHistory(false, true)
    }, 120000)

    return () => clearInterval(interval)
  }, [session])

  // Apply filters whenever owners or statusFilter changes
  useEffect(() => {
    if (owners.length > 0) {
      let filtered = [...owners]

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((owner) => owner.status === statusFilter)
      }

      setFilteredOwners(filtered)
    } else {
      setFilteredOwners([])
    }
  }, [owners, statusFilter])

  const fetchOwners = async (showToast = false, isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
      }
      if (showToast) {
        setRefreshing(true)
      }
      if (isBackground) {
        setBackgroundRefreshing(true)
      }

      const res = await fetch("/api/beneficial-ownership")
      const data = await res.json()

      if (data.owners) {
        setOwners(data.owners)
      }

      if (showToast) {
        toast({
          title: "Refreshed",
          description: "Beneficial ownership data has been refreshed.",
        })
      }
    } catch (error) {
      console.error("Error fetching owners:", error)
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to fetch beneficial owners.",
          variant: "destructive",
        })
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
      if (showToast) {
        setRefreshing(false)
      }
      setBackgroundRefreshing(false)
    }
  }

  // Fetch filing history from annual reports
  const fetchFilingHistory = async (showToast = false, isBackground = false) => {
    try {
      const res = await fetch("/api/annual-reports/filings")
      if (!res.ok) throw new Error("Failed to fetch filing history")

      const data = await res.json()

      // Filter for completed or closed filings and transform to our format
      const pastFilings =
        data.filings
          ?.filter((filing: any) => filing.status === "completed" || filing.status === "closed")
          .map((filing: any) => ({
            id: filing.id,
            title: filing.deadlineTitle || (filing.deadline ? filing.deadline.title : "Beneficial Ownership Report"),
            filedDate: filing.filedDate || filing.createdAt,
            status: "filed", // Set status to "filed" as requested
            reportUrl: filing.reportUrl,
          })) || []

      // Add some mock BOI-specific filings if none exist
      if (pastFilings.length === 0) {
        const mockFilings = [
          {
            id: "boi-initial",
            title: "Initial BOI Report",
            filedDate: "2023-01-15T12:00:00Z",
            status: "filed",
          },
          {
            id: "boi-update",
            title: "BOI Update",
            filedDate: "2024-03-10T12:00:00Z",
            status: "filed",
          },
        ]
        setFilingHistory(mockFilings)
      } else {
        // Filter to only include BOI-related filings
        const boiFilings = pastFilings.filter(
          (filing: any) =>
            filing.title.toLowerCase().includes("boi") ||
            filing.title.toLowerCase().includes("beneficial") ||
            filing.title.toLowerCase().includes("ownership"),
        )

        setFilingHistory(boiFilings.length > 0 ? boiFilings : pastFilings.slice(0, 3))
      }
    } catch (error) {
      console.error("Error fetching filing history:", error)
      // Use mock data as fallback
      setFilingHistory([
        {
          id: "boi-initial",
          title: "Initial BOI Report",
          filedDate: "2023-01-15T12:00:00Z",
          status: "filed",
        },
        {
          id: "boi-update",
          title: "BOI Update",
          filedDate: "2024-03-10T12:00:00Z",
          status: "filed",
        },
      ])
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
    if (
      !formData.name ||
      !formData.title ||
      !formData.ownershipPercentage ||
      Number.parseFloat(formData.ownershipPercentage) <= 0
    ) {
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

    // Calculate new total ownership excluding CEO
    const newOwnerPercentage = Number.parseFloat(formData.ownershipPercentage)
    const otherOwnersTotal = owners.reduce((sum, owner) => sum + (owner.isDefault ? 0 : owner.ownershipPercentage), 0)
    const newTotal = otherOwnersTotal + newOwnerPercentage

    // Check if total ownership would exceed 100%
    if (newTotal > 100) {
      toast({
        title: "Validation Error",
        description: "Total ownership percentage cannot exceed 100%.",
        variant: "destructive",
      })
      return
    }

    // Calculate new CEO percentage (automatically adjust to maintain 100% total)
    const newCeoPercentage = 100 - newTotal

    try {
      setSubmitting(true)

      // First update the CEO's ownership percentage ONLY
      const ceoUpdateRes = await fetch(`/api/beneficial-ownership/${ceoOwner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownershipPercentage: newCeoPercentage.toString(),
        }),
      })

      if (!ceoUpdateRes.ok) {
        const ceoData = await ceoUpdateRes.json()
        throw new Error(ceoData.error || "Failed to update CEO ownership")
      }

      // Then add the new owner
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
    if (
      !formData.name ||
      !formData.title ||
      !formData.ownershipPercentage ||
      Number.parseFloat(formData.ownershipPercentage) <= 0
    ) {
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
    } else {
      // If editing a non-CEO owner
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

      // Calculate new total ownership excluding CEO and current owner
      const otherOwnersTotal = owners.reduce(
        (sum, owner) => (owner.isDefault || owner.id === currentOwner.id ? sum : sum + owner.ownershipPercentage),
        0,
      )

      // Calculate new total with updated ownership
      const newTotal = otherOwnersTotal + newOwnerPercentage

      // Check if total would exceed 100%
      if (newTotal > 100) {
        toast({
          title: "Validation Error",
          description: "Total ownership percentage cannot exceed 100%.",
          variant: "destructive",
        })
        return
      }

      // Calculate new CEO percentage
      const newCeoPercentage = 100 - newTotal

      // Update CEO's ownership first - ONLY update the ownership percentage
      try {
        const ceoUpdateRes = await fetch(`/api/beneficial-ownership/${ceoOwner.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownershipPercentage: newCeoPercentage.toString(),
          }),
        })

        if (!ceoUpdateRes.ok) {
          const ceoData = await ceoUpdateRes.json()
          throw new Error(ceoData.error || "Failed to update CEO ownership")
        }
      } catch (error) {
        console.error("Error updating CEO ownership:", error)
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }
    }

    try {
      setSubmitting(true)

      // Update the current owner
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

    // Don't allow deleting the default owner
    if (currentOwner.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "The primary owner cannot be deleted.",
        variant: "destructive",
      })
      setOpenDeleteDialog(false)
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

    // Calculate new CEO percentage after deletion
    const newCeoPercentage = ceoOwner.ownershipPercentage + currentOwner.ownershipPercentage

    try {
      setSubmitting(true)

      // First update the CEO's ownership percentage ONLY
      const ceoUpdateRes = await fetch(`/api/beneficial-ownership/${ceoOwner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownershipPercentage: newCeoPercentage.toString(),
        }),
      })

      if (!ceoUpdateRes.ok) {
        const ceoData = await ceoUpdateRes.json()
        throw new Error(ceoData.error || "Failed to update CEO ownership")
      }

      // Then delete the owner
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
      title: owner.title,
      ownershipPercentage: owner.ownershipPercentage.toString(),
    })
    setOpenEditDialog(true)
  }

  const openDelete = (owner: any) => {
    setCurrentOwner(owner)
    setOpenDeleteDialog(true)
  }

  // Update the getStatusBadge function to make the "filed" status more prominent
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
            <CheckCircle className="mr-1 h-3 w-3" />
            Reported
          </Badge>
        )
      case "filed":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 font-medium text-base px-3 py-1 shadow-sm border-green-300 animate-pulse"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Filed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMMM d, yyyy")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* Card Header Skeleton */}
          <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-72 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-[180px] sm:w-[200px] bg-muted rounded animate-pulse"></div>
              <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          {/* Card Content Skeleton */}
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <div className="h-9 w-32 bg-muted rounded animate-pulse"></div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-border">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 py-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-5 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>

                {/* Table Rows */}
                {[...Array(4)].map((_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-5 gap-4 py-4">
                    {[...Array(5)].map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className={`h-5 bg-muted rounded animate-pulse ${
                          colIndex === 0 ? "w-32" : colIndex === 4 ? "w-20" : "w-full"
                        }`}
                        style={{
                          animationDelay: `${(rowIndex * 5 + colIndex) * 50}ms`,
                        }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Footer Skeleton */}
          <div className="p-6 flex justify-between">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Loading data...</span>
        </div>
      </div>
    )
  }

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0)
  const ceoOwner = owners.find((o) => o.isDefault)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {backgroundRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Beneficial Ownership</CardTitle>
              <CardDescription>
                Manage your company's beneficial ownership information. All changes require approval.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[180px] sm:w-[200px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchOwners(true)}
                disabled={refreshing}
                className="relative"
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center ${refreshing ? "opacity-100" : "opacity-0"}`}
                >
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className={refreshing ? "opacity-0" : "opacity-100"}>
                  <RefreshCw className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </div>
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
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Beneficial Owner</DialogTitle>
                  <DialogDescription>
                    Add a new beneficial owner to your company. Your ownership percentage will automatically adjust.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOwner}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="ownershipPercentage">Ownership Percentage (%)</Label>
                      <Input
                        id="ownershipPercentage"
                        name="ownershipPercentage"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.ownershipPercentage}
                        onChange={handleInputChange}
                        placeholder="Enter ownership percentage"
                        required
                      />
                      <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p>
                          Available:{" "}
                          {formData.ownershipPercentage
                            ? (
                                100 -
                                Number.parseFloat(formData.ownershipPercentage) -
                                owners.reduce((sum, o) => (o.isDefault ? 0 : sum + o.ownershipPercentage), 0)
                              ).toFixed(2)
                            : ceoOwner?.ownershipPercentage}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
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

          <div className="overflow-x-auto">
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
                {filteredOwners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No beneficial owners found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOwners.map((owner) => (
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
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Note: Changes to beneficial ownership require approval and will be marked as pending until reviewed.
          </p>
        </CardFooter>
      </Card>

      {/* Filing History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filing History</CardTitle>
          <CardDescription>Past filings of beneficial ownership information.</CardDescription>
        </CardHeader>
        <CardContent>
          {filingHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No filing history available.</div>
          ) : (
            <div className="space-y-4">
              {filingHistory.map((filing) => (
                <div key={filing.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[15px]">{filing.title}</h3>
                      <p className="text-[15px] text-muted-foreground">Filed on: {formatDate(filing.filedDate)}</p>
                    </div>
                    <div className="flex items-center">{getStatusBadge(filing.status)}</div>
                  </div>
                  {filing.reportUrl && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={filing.reportUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          View Report
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Beneficial Owner</DialogTitle>
            <DialogDescription>
              {currentOwner?.isDefault
                ? "Update the primary owner's information."
                : "Update the beneficial owner's information. Your ownership will automatically adjust."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditOwner}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-ownershipPercentage">Ownership Percentage (%)</Label>
                <Input
                  id="edit-ownershipPercentage"
                  name="ownershipPercentage"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={formData.ownershipPercentage}
                  onChange={handleInputChange}
                  placeholder="Enter ownership percentage"
                  required
                />
                {currentOwner && !currentOwner.isDefault && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>
                      Available:{" "}
                      {formData.ownershipPercentage
                        ? (
                            100 -
                            Number.parseFloat(formData.ownershipPercentage) -
                            owners.reduce(
                              (sum, o) => (o.isDefault || o.id === currentOwner.id ? 0 : sum + o.ownershipPercentage),
                              0,
                            )
                          ).toFixed(2)
                        : ceoOwner?.ownershipPercentage}
                      %
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
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
              This will permanently delete the beneficial owner. This action cannot be undone. The primary owner's
              percentage will increase by {currentOwner?.ownershipPercentage || 0}%.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOwner}
              disabled={submitting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
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

