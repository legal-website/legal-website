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
  statusHistory: {
    id: string
    status: string
    createdAt: string
    notes: string | null
    updatedBy: string | null
  }[]
}

// Define interface for additional data
interface AmendmentUpdateData {
  paymentAmount?: number
  notes?: string
  [key: string]: any // Allow other properties
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

  // Add console logs for debugging
  console.log("Rendering AmendmentsPage, loading:", loading)

  useEffect(() => {
    const fetchAmendments = async () => {
      try {
        console.log("Fetching amendments...")
        const response = await fetch("/api/admin/amendments")
        console.log("Response received:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          throw new Error(errorData.error || "Failed to fetch amendments")
        }

        const data = await response.json()
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

    fetchAmendments()
  }, [])

  const updateAmendmentStatus = async (
    amendmentId: string,
    newStatus: Amendment["status"],
    additionalData: AmendmentUpdateData = {},
  ) => {
    try {
      const formData = new FormData()
      formData.append("status", newStatus)

      if ("paymentAmount" in additionalData && additionalData.paymentAmount !== undefined) {
        formData.append("paymentAmount", additionalData.paymentAmount.toString())
      }

      if ("notes" in additionalData && additionalData.notes !== undefined) {
        formData.append("notes", additionalData.notes)
      }

      const response = await fetch(`/api/admin/amendments/${amendmentId}/status`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update amendment status")
      }

      const updatedAmendment = await response.json()

      // Update the amendments list with the updated amendment
      setAmendments((prev) =>
        prev.map((amendment) => (amendment.id === amendmentId ? { ...amendment, ...updatedAmendment } : amendment)),
      )

      toast({
        title: "Status updated",
        description: `Amendment status updated to ${newStatus}`,
      })
    } catch (err) {
      console.error("Error updating amendment status:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const approveAmendment = async (amendmentId: string) => {
    await updateAmendmentStatus(amendmentId, "approved")
  }

  const rejectAmendment = async (amendmentId: string) => {
    await updateAmendmentStatus(amendmentId, "rejected")
  }

  const handleRequestPayment = (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setIsDialogOpen(true)
  }

  const handleSubmitPayment = async () => {
    if (!paymentAmount || isNaN(Number.parseFloat(paymentAmount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    if (!selectedAmendmentId) {
      console.error("No amendment selected for payment request.")
      return
    }

    const updateData: AmendmentUpdateData = {
      paymentAmount: Number.parseFloat(paymentAmount),
    }

    if (adminNotes) {
      updateData.notes = adminNotes
    }

    await updateAmendmentStatus(selectedAmendmentId, "waiting_for_payment", updateData)

    setIsDialogOpen(false)
    setPaymentAmount("")
    setAdminNotes("")
    setSelectedAmendmentId(null)
  }

  const PaymentDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              min="0"
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
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitPayment}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const filteredAmendments =
    activeTab === "all" ? amendments : amendments.filter((amendment) => amendment.status === activeTab)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Amendments</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null)
              setLoading(true)
              window.location.reload()
            }}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg">Loading amendments...</p>
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
                <AmendmentsList
                  amendments={filteredAmendments}
                  onApprove={approveAmendment}
                  onReject={rejectAmendment}
                  onRequestPayment={handleRequestPayment}
                  onUpdateStatus={updateAmendmentStatus}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      <PaymentDialog />
    </div>
  )
}

function AmendmentsList({
  amendments,
  onApprove,
  onReject,
  onRequestPayment,
  onUpdateStatus,
}: {
  amendments: Amendment[]
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onRequestPayment: (id: string) => void
  onUpdateStatus: (id: string, status: Amendment["status"], data?: AmendmentUpdateData) => Promise<void>
}) {
  return (
    <>
      {amendments.map((amendment) => (
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

            <div className="text-xs text-gray-400">Submitted: {new Date(amendment.createdAt).toLocaleDateString()}</div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {amendment.status === "pending" && (
              <>
                <Button size="sm" onClick={() => onApprove(amendment.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(amendment.id)}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRequestPayment(amendment.id)}>
                  Request Payment
                </Button>
              </>
            )}

            {amendment.status === "waiting_for_payment" && amendment.receiptUrl && (
              <Button size="sm" onClick={() => onUpdateStatus(amendment.id, "payment_received")}>
                Confirm Payment
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </>
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

