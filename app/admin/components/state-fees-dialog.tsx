"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Save, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { toast } from "@/components/ui/use-toast"

interface StateFeesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StateFeesDialog({ open, onOpenChange }: StateFeesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingState, setEditingState] = useState<string | null>(null)
  const [editingFee, setEditingFee] = useState<number | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null)
  const [editingDescription, setEditingDescription] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // State data
  const [stateFilingFees, setStateFilingFees] = useState<Record<string, number>>({})
  const [stateDiscounts, setStateDiscounts] = useState<Record<string, number>>({})
  const [stateDescriptions, setStateDescriptions] = useState<Record<string, string>>({})

  // Fetch state data
  useEffect(() => {
    if (open) {
      fetchStateData()
    }
  }, [open])

  const fetchStateData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/pricing")

      if (!response.ok) {
        throw new Error("Failed to fetch pricing data")
      }

      const data = await response.json()
      setStateFilingFees(data.stateFilingFees || {})
      setStateDiscounts(data.stateDiscounts || {})
      setStateDescriptions(data.stateDescriptions || {})
    } catch (error) {
      console.error("Error fetching state data:", error)
      toast({
        title: "Error",
        description: "Failed to load state fee information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStates = Object.keys(stateFilingFees).filter((state) =>
    state.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Add a function to delete a state
  const handleDeleteState = async (state: string) => {
    if (!confirm(`Are you sure you want to delete ${state}?`)) return

    try {
      // Remove the state from all state data objects
      const newStateFilingFees = { ...stateFilingFees }
      delete newStateFilingFees[state]

      const newStateDiscounts = { ...stateDiscounts }
      delete newStateDiscounts[state]

      const newStateDescriptions = { ...stateDescriptions }
      delete newStateDescriptions[state]

      // Update local state
      setStateFilingFees(newStateFilingFees)
      setStateDiscounts(newStateDiscounts)
      setStateDescriptions(newStateDescriptions)

      // Fetch current pricing data to get plans
      const response = await fetch("/api/pricing")
      const data = await response.json()

      // Save to API
      await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          stateFilingFees: newStateFilingFees,
          stateDiscounts: newStateDiscounts,
          stateDescriptions: newStateDescriptions,
        }),
      })

      // Show success message
      toast({
        title: "Success",
        description: `${state} has been deleted successfully`,
      })
    } catch (error) {
      console.error("Error deleting state:", error)
      toast({
        title: "Error",
        description: "Failed to delete state. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Modify the handleAddNewState function to ensure it properly adds a new state
  const handleAddNewState = () => {
    const stateName = prompt("Enter the name of the new state:")
    if (!stateName) return

    if (stateFilingFees[stateName]) {
      toast({
        title: "Error",
        description: "This state already exists.",
        variant: "destructive",
      })
      return
    }

    // Add the new state with default values
    setStateFilingFees({
      ...stateFilingFees,
      [stateName]: 0,
    })

    // Set it as the editing state
    setEditingState(stateName)
    setEditingFee(0)
    setEditingDiscount(0)
    setEditingDescription("")
  }

  // Enhance the handleSaveStateChanges function to ensure it properly saves all state data
  const handleSaveStateChanges = async () => {
    if (!editingState) return

    try {
      // Update local state
      const newStateFilingFees = { ...stateFilingFees }
      if (editingFee !== null) {
        newStateFilingFees[editingState] = editingFee
      }

      const newStateDiscounts = { ...stateDiscounts }
      if (editingDiscount !== null) {
        if (editingDiscount > 0) {
          newStateDiscounts[editingState] = editingDiscount
        } else {
          delete newStateDiscounts[editingState]
        }
      }

      const newStateDescriptions = { ...stateDescriptions }
      if (editingDescription) {
        newStateDescriptions[editingState] = editingDescription
      } else {
        delete newStateDescriptions[editingState]
      }

      setStateFilingFees(newStateFilingFees)
      setStateDiscounts(newStateDiscounts)
      setStateDescriptions(newStateDescriptions)

      // Fetch current pricing data to get plans
      const response = await fetch("/api/pricing")
      const data = await response.json()

      // Save to API
      await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          stateFilingFees: newStateFilingFees,
          stateDiscounts: newStateDiscounts,
          stateDescriptions: newStateDescriptions,
        }),
      })

      // Show success message
      toast({
        title: "Success",
        description: `State fees for ${editingState} updated successfully`,
      })

      // Reset editing state
      setEditingState(null)
      setEditingFee(null)
      setEditingDiscount(null)
      setEditingDescription("")
    } catch (error) {
      console.error("Error saving state changes:", error)
      toast({
        title: "Error",
        description: "Failed to update state fees. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage State Filing Fees</DialogTitle>
          <DialogDescription>Update state filing fees, discounts, and descriptions.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 flex justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search states..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNewState}>Add New State</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {editingState && (
                <div className="mb-6 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-4">Edit {editingState}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="filing-fee">Filing Fee ($)</Label>
                        <Input
                          id="filing-fee"
                          type="number"
                          value={editingFee !== null ? editingFee : stateFilingFees[editingState]}
                          onChange={(e) => setEditingFee(e.target.value ? Number.parseFloat(e.target.value) : 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount">Discount ($)</Label>
                        <Input
                          id="discount"
                          type="number"
                          value={editingDiscount !== null ? editingDiscount : stateDiscounts[editingState] || 0}
                          onChange={(e) => setEditingDiscount(e.target.value ? Number.parseFloat(e.target.value) : 0)}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter 0 to remove discount</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editingDescription || stateDescriptions[editingState] || ""}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="e.g. Annual Report: $50 (10th April)"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingState(null)
                          setEditingFee(null)
                          setEditingDiscount(null)
                          setEditingDescription("")
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveStateChanges}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium">State</th>
                      <th className="text-left p-3 text-xs font-medium">Filing Fee</th>
                      <th className="text-left p-3 text-xs font-medium">Discount</th>
                      <th className="text-left p-3 text-xs font-medium">Description</th>
                      <th className="text-left p-3 text-xs font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStates.length > 0 ? (
                      filteredStates.map((state) => (
                        <tr key={state} className="border-t">
                          <td className="p-3">{state}</td>
                          <td className="p-3">${stateFilingFees[state]}</td>
                          <td className="p-3">{stateDiscounts[state] ? `$${stateDiscounts[state]}` : "-"}</td>
                          <td className="p-3 max-w-xs truncate">{stateDescriptions[state] || "-"}</td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingState(state)
                                  setEditingFee(stateFilingFees[state])
                                  setEditingDiscount(stateDiscounts[state] || 0)
                                  setEditingDescription(stateDescriptions[state] || "")
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleDeleteState(state)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          No states found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

