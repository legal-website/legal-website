"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  FileEdit,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Eye,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Amendment {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  details: string
  status: "pending" | "in_review" | "waiting_for_payment" | "payment_received" | "approved" | "rejected" | "closed"
  createdAt: string
  updatedAt: string
  documentUrl?: string
  receiptUrl?: string
  paymentAmount?: number
  notes?: string
}

export default function AdminAmendmentsPage() {
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [filteredAmendments, setFilteredAmendments] = useState<Amendment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Amendment["status"] | "all">("all")
  const [loading, setLoading] = useState(true)
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAmendments()
  }, [])

  useEffect(() => {
    filterAmendments()
  }, [amendments, searchTerm, statusFilter])

  const fetchAmendments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/amendments")
      if (!response.ok) {
        throw new Error("Failed to fetch amendments")
      }
      const data = await response.json()
      setAmendments(data.amendments)
    } catch (error) {
      console.error("Error fetching amendments:", error)
      toast({
        title: "Error",
        description: "Failed to load amendments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAmendments = () => {
    let filtered = [...amendments]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.userName.toLowerCase().includes(term) ||
          a.userEmail.toLowerCase().includes(term) ||
          a.id.toLowerCase().includes(term) ||
          a.type.toLowerCase().includes(term) ||
          a.details.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter)
    }

    setFilteredAmendments(filtered)
  }

  const updateAmendmentStatus = async (amendmentId: string, newStatus: Amendment["status"], additionalData = {}) => {
    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("status", newStatus)

      if (additionalData.hasOwnProperty("paymentAmount")) {
        formData.append("paymentAmount", additionalData.paymentAmount.toString())
      }

      if (additionalData.hasOwnProperty("notes")) {
        formData.append("notes", additionalData.notes)
      }

      const response = await fetch(`/api/admin/amendments/${amendmentId}`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update amendment status")
      }

      const data = await response.json()

      // Update amendments list
      setAmendments((prev) => prev.map((a) => (a.id === amendmentId ? data.amendment : a)))

      if (selectedAmendment?.id === amendmentId) {
        setSelectedAmendment(data.amendment)
      }

      toast({
        title: "Success",
        description: `Amendment status updated to ${newStatus.replace("_", " ")}`,
      })
    } catch (error) {
      console.error("Error updating amendment status:", error)
      toast({
        title: "Error",
        description: "Failed to update amendment status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const requestPayment = async (amendmentId: string) => {
    if (!paymentAmount || isNaN(Number.parseFloat(paymentAmount)) || Number.parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    await updateAmendmentStatus(amendmentId, "waiting_for_payment", {
      paymentAmount: Number.parseFloat(paymentAmount),
      notes: adminNotes || undefined,
    })

    setPaymentAmount("")
    setAdminNotes("")
  }

  const approvePayment = async (amendmentId: string) => {
    await updateAmendmentStatus(amendmentId, "approved")
  }

  // Helper function to get status badge
  const getStatusBadge = (status: Amendment["status"]) => {
    const statusConfig = {
      pending: { bg: "bg-blue-100", text: "text-blue-800", label: "Pending" },
      in_review: { bg: "bg-purple-100", text: "text-purple-800", label: "In Review" },
      waiting_for_payment: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Payment Required" },
      payment_received: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Payment Received" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
    }

    const config = statusConfig[status]

    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    )
  }

  // Helper function to get status icon
  const getStatusIcon = (status: Amendment["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "in_review":
        return <FileText className="h-5 w-5 text-purple-500" />
      case "waiting_for_payment":
        return <DollarSign className="h-5 w-5 text-yellow-500" />
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-indigo-500" />
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "closed":
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Amendments Management</h1>
        <Button onClick={fetchAmendments} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Amendments</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search amendments..."
                className="pl-9 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="waiting_for_payment">Payment Required</option>
              <option value="payment_received">Payment Received</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <TabsContent value="all">
          <AmendmentsList
            amendments={filteredAmendments}
            loading={loading}
            onViewAmendment={setSelectedAmendment}
            onUpdateStatus={updateAmendmentStatus}
            onRequestPayment={requestPayment}
            onApprovePayment={approvePayment}
          />
        </TabsContent>

        <TabsContent value="pending">
          <AmendmentsList
            amendments={filteredAmendments.filter((a) => a.status === "pending" || a.status === "in_review")}
            loading={loading}
            onViewAmendment={setSelectedAmendment}
            onUpdateStatus={updateAmendmentStatus}
            onRequestPayment={requestPayment}
            onApprovePayment={approvePayment}
          />
        </TabsContent>

        <TabsContent value="payment">
          <AmendmentsList
            amendments={filteredAmendments.filter(
              (a) => a.status === "waiting_for_payment" || a.status === "payment_received",
            )}
            loading={loading}
            onViewAmendment={setSelectedAmendment}
            onUpdateStatus={updateAmendmentStatus}
            onRequestPayment={requestPayment}
            onApprovePayment={approvePayment}
          />
        </TabsContent>

        <TabsContent value="approved">
          <AmendmentsList
            amendments={filteredAmendments.filter((a) => a.status === "approved")}
            loading={loading}
            onViewAmendment={setSelectedAmendment}
            onUpdateStatus={updateAmendmentStatus}
            onRequestPayment={requestPayment}
            onApprovePayment={approvePayment}
          />
        </TabsContent>
      </Tabs>

      {/* Amendment Details Dialog */}
      {selectedAmendment && (
        <Dialog open={!!selectedAmendment} onOpenChange={() => setSelectedAmendment(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Amendment Details
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Amendment Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Amendment ID</p>
                    <p className="font-medium">{selectedAmendment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{selectedAmendment.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Details</p>
                    <p className="font-medium">{selectedAmendment.details}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedAmendment.status)}
                      {getStatusBadge(selectedAmendment.status)}
                    </div>
                  </div>
                  {selectedAmendment.paymentAmount && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Amount</p>
                      <p className="font-medium">${selectedAmendment.paymentAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedAmendment.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium">{selectedAmendment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-4">
                  {selectedAmendment.status === "pending" && (
                    <Button className="w-full" onClick={() => updateAmendmentStatus(selectedAmendment.id, "in_review")}>
                      Start Review
                    </Button>
                  )}

                  {selectedAmendment.status === "in_review" && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-notes">Notes (Optional)</Label>
                        <Input
                          id="admin-notes"
                          placeholder="Add notes for client"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={() => requestPayment(selectedAmendment.id)}>
                        Request Payment
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => updateAmendmentStatus(selectedAmendment.id, "rejected")}
                      >
                        Reject Amendment
                      </Button>
                    </div>
                  )}

                  {selectedAmendment.status === "payment_received" && (
                    <Button className="w-full" onClick={() => approvePayment(selectedAmendment.id)}>
                      Approve Payment & Complete
                    </Button>
                  )}

                  {selectedAmendment.documentUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedAmendment.documentUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download Supporting Document
                      </a>
                    </Button>
                  )}

                  {selectedAmendment.receiptUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedAmendment.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download Payment Receipt
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Amendments List Component
function AmendmentsList({
  amendments,
  loading,
  onViewAmendment,
  onUpdateStatus,
  onRequestPayment,
  onApprovePayment,
}: {
  amendments: Amendment[]
  loading: boolean
  onViewAmendment: (amendment: Amendment) => void
  onUpdateStatus: (id: string, status: Amendment["status"], data?: any) => Promise<void>
  onRequestPayment: (id: string) => Promise<void>
  onApprovePayment: (id: string) => Promise<void>
}) {
  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading amendments...</p>
        </div>
      </Card>
    )
  }

  if (amendments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No amendments found</h3>
          <p className="text-gray-500">No amendments match your current filters.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">ID</th>
              <th className="text-left p-4 font-medium">Client</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium">Submitted</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {amendments.map((amendment) => (
              <tr key={amendment.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono text-sm">{amendment.id}</td>
                <td className="p-4">
                  <div className="font-medium">{amendment.userName}</div>
                  <div className="text-sm text-gray-500">{amendment.userEmail}</div>
                </td>
                <td className="p-4">{amendment.type}</td>
                <td className="p-4 whitespace-nowrap">{new Date(amendment.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(amendment.status)}
                    {getStatusBadge(amendment.status)}
                  </div>
                </td>
                <td className="p-4">
                  <Button variant="outline" size="sm" onClick={() => onViewAmendment(amendment)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

