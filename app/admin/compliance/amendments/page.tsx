"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Define Amendment type
interface Amendment {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  details: string
  status: string
  createdAt: string
  updatedAt: string
  documentUrl: string | null
  receiptUrl: string | null
  paymentAmount: number | null
  notes: string | null
}

export default function AmendmentsPage() {
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [selectedAmendmentId, setSelectedAmendmentId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<string | null>(null)

  useEffect(() => {
    fetchAmendments()
  }, [])

  const fetchAmendments = async () => {
    try {
      console.log("Fetching amendments...")
      setLoading(true)
      const response = await fetch("/api/admin/amendments")
      console.log("Response received:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Failed to fetch amendments")
      }

      const data = await response.json().catch(() => {
        console.error("Failed to parse JSON response")
        throw new Error("Invalid response format from server")
      })

      console.log("Amendments data:", data)

      if (data && Array.isArray(data.amendments)) {
        setAmendments(data.amendments)
      } else {
        console.error("Invalid data format:", data)
        throw new Error("Invalid data format received from server")
      }
    } catch (err) {
      console.error("Error fetching amendments:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (amendmentId: string, action: string, additionalData = {}) => {
    try {
      setSelectedAmendmentId(amendmentId)
      setActionType(action)

      console.log(`Performing action ${action} on amendment ${amendmentId}`)

      const formData = new FormData()
      formData.append("status", action)

      // Add any additional data to the form
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      // Log the form data for debugging
      console.log("Form data:", Object.fromEntries(formData.entries()))

      // Make the API request
      const response = await fetch(`/api/admin/amendments/${amendmentId}/status`, {
        method: "PATCH",
        body: formData,
      })

      console.log(`Response status: ${response.status}`)

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)

        let errorMessage = "Failed to update amendment status"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Failed to parse error response:", e)
        }

        throw new Error(errorMessage)
      }

      // Parse the response
      const responseText = await response.text()
      console.log("Response text:", responseText)

      let updatedAmendment: Amendment
      try {
        updatedAmendment = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response:", e)
        throw new Error("Invalid response format from server")
      }

      // Update the amendments list
      setAmendments((prev) =>
        prev.map((amendment) => (amendment.id === amendmentId ? { ...amendment, ...updatedAmendment } : amendment)),
      )

      toast({
        title: "Success",
        description: `Amendment status updated to ${action.replace("_", " ")}`,
      })

      return true
    } catch (err) {
      console.error(`Error performing action ${action}:`, err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      })
      return false
    } finally {
      setSelectedAmendmentId(null)
      setActionType(null)
    }
  }

  const handleApprove = async (amendmentId: string) => {
    await handleAction(amendmentId, "approved")
  }

  const handleReject = async (amendmentId: string) => {
    await handleAction(amendmentId, "rejected")
  }

  const openPaymentDialog = (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setPaymentAmount("")
    setAdminNotes("")
    setIsDialogOpen(true)
  }

  const handleRequestPayment = async () => {
    if (!paymentAmount || isNaN(Number.parseFloat(paymentAmount)) || Number.parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount greater than zero",
        variant: "destructive",
      })
      return
    }

    if (!selectedAmendmentId) {
      console.error("No amendment selected for payment request.")
      return
    }

    const success = await handleAction(selectedAmendmentId, "waiting_for_payment", {
      paymentAmount: Number.parseFloat(paymentAmount),
      notes: adminNotes || undefined,
    })

    if (success) {
      setIsDialogOpen(false)
      setPaymentAmount("")
      setAdminNotes("")
    }
  }

  const filteredAmendments =
    activeTab === "all" ? amendments : amendments.filter((amendment) => amendment.status === activeTab)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Amendments</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAmendments} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-lg">Loading amendments...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="waiting_for_payment">Payment Required</TabsTrigger>
            <TabsTrigger value="payment_received">Payment Received</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredAmendments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-500">No amendments found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAmendments.map((amendment) => (
                  <Card key={amendment.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{amendment.type}</CardTitle>
                        <StatusBadge status={amendment.status} />
                      </div>
                      <CardDescription>
                        Submitted by {amendment.userName} ({amendment.userEmail})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium">Details:</h4>
                        <p className="text-sm text-gray-500">{amendment.details}</p>
                      </div>

                      {amendment.documentUrl && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Document:</h4>
                          <a
                            href={amendment.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}

                      {amendment.paymentAmount !== null && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Payment Amount:</h4>
                          <p className="text-sm text-gray-500">${amendment.paymentAmount.toFixed(2)}</p>
                        </div>
                      )}

                      {amendment.notes && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Notes:</h4>
                          <p className="text-sm text-gray-500">{amendment.notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Submitted: {new Date(amendment.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      {amendment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(amendment.id)}
                            disabled={selectedAmendmentId === amendment.id}
                          >
                            {selectedAmendmentId === amendment.id && actionType === "approved" ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(amendment.id)}
                            disabled={selectedAmendmentId === amendment.id}
                          >
                            {selectedAmendmentId === amendment.id && actionType === "rejected" ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(amendment.id)}
                            disabled={selectedAmendmentId === amendment.id}
                          >
                            Request Payment
                          </Button>
                        </>
                      )}

                      {amendment.status === "waiting_for_payment" && amendment.receiptUrl && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(amendment.id, "payment_received")}
                          disabled={selectedAmendmentId === amendment.id}
                        >
                          {selectedAmendmentId === amendment.id && actionType === "payment_received" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Confirm Payment
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!selectedAmendmentId || !actionType) setIsDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>Enter the payment amount required for this amendment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Optional notes for the client"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={selectedAmendmentId !== null && actionType === "waiting_for_payment"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayment}
              disabled={selectedAmendmentId !== null && actionType === "waiting_for_payment"}
            >
              {selectedAmendmentId !== null && actionType === "waiting_for_payment" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"
  const label = status.replace("_", " ")

  switch (status) {
    case "approved":
      variant = "default" // green
      break
    case "rejected":
      variant = "destructive" // red
      break
    case "pending":
      variant = "outline"
      break
    case "waiting_for_payment":
    case "payment_received":
      variant = "secondary" // gray
      break
  }

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}

