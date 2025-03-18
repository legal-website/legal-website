"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
      // In a real implementation, this would be an API call
      // For now, we'll simulate with mock data
      const mockAmendments: Amendment[] = [
        {
          id: "amd-001",
          userId: "user-123",
          userName: "John Smith",
          userEmail: "john@example.com",
          type: "Company Name Change",
          details: "Change company name from ABC LLC to XYZ Enterprises LLC",
          status: "pending",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "amd-002",
          userId: "user-456",
          userName: "Sarah Johnson",
          userEmail: "sarah@example.com",
          type: "Address Change",
          details: "Update business address to 123 New Street, New City, NY 10001",
          status: "waiting_for_payment",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          paymentAmount: 150,
        },
        {
          id: "amd-003",
          userId: "user-789",
          userName: "Michael Brown",
          userEmail: "michael@example.com",
          type: "Ownership Change",
          details: "Transfer 25% ownership from Michael Brown to Lisa Chen",
          status: "payment_received",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          paymentAmount: 250,
          receiptUrl: "/placeholder.svg?height=300&width=200",
        },
        {
          id: "amd-004",
          userId: "user-101",
          userName: "David Wilson",
          userEmail: "david@example.com",
          type: "Business Purpose Change",
          details: "Update business purpose to include software development services",
          status: "in_review",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "amd-005",
          userId: "user-202",
          userName: "Emily Davis",
          userEmail: "emily@example.com",
          type: "Company Name Change",
          details: "Change company name from Davis Consulting to Davis Enterprise Solutions",
          status: "approved",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          paymentAmount: 175,
          receiptUrl: "/placeholder.svg?height=300&width=200",
        },
      ]

      setAmendments(mockAmendments)
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

      // In a real implementation, this would be an API call
      // For now, we'll simulate success and update our local state

      const updatedAmendments = amendments.map((a) =>
        a.id === amendmentId
          ? {
              ...a,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              ...additionalData,
            }
          : a,
      )

      setAmendments(updatedAmendments)

      if (selectedAmendment?.id === amendmentId) {
        const updated = updatedAmendments.find((a) => a.id === amendmentId)
        if (updated) {
          setSelectedAmendment(updated)
        }
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

        <TabsContent value="all" className="mt-0">
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Loading amendments...
                      </td>
                    </tr>
                  ) : filteredAmendments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        No amendments found
                      </td>
                    </tr>
                  ) : (
                    filteredAmendments.map((amendment) => (
                      <tr key={amendment.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{amendment.id}</td>
                        <td className="p-4">
                          <div className="font-medium">{amendment.userName}</div>
                          <div className="text-sm text-gray-500">{amendment.userEmail}</div>
                        </td>
                        <td className="p-4">{amendment.type}</td>
                        <td className="p-4 whitespace-nowrap">{new Date(amendment.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">{getStatusBadge(amendment.status)}</td>
                        <td className="p-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => setSelectedAmendment(amendment)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              {selectedAmendment && (
                                <>
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
                                          <p className="text-sm text-gray-500">Submitted</p>
                                          <p className="font-medium">
                                            {new Date(selectedAmendment.createdAt).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Last Updated</p>
                                          <p className="font-medium">
                                            {new Date(selectedAmendment.updatedAt).toLocaleString()}
                                          </p>
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
                                            <p className="text-sm text-gray-500">Admin Notes</p>
                                            <p className="font-medium">{selectedAmendment.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                                      <div className="space-y-3 mb-6">
                                        <div>
                                          <p className="text-sm text-gray-500">Name</p>
                                          <p className="font-medium">{selectedAmendment.userName}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Email</p>
                                          <p className="font-medium">{selectedAmendment.userEmail}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">User ID</p>
                                          <p className="font-medium">{selectedAmendment.userId}</p>
                                        </div>
                                      </div>

                                      {selectedAmendment.receiptUrl && (
                                        <div className="mb-6">
                                          <h4 className="font-medium mb-2">Payment Receipt</h4>
                                          <div className="border rounded-md p-2 mb-2">
                                            <img
                                              src={selectedAmendment.receiptUrl || "/placeholder.svg"}
                                              alt="Payment Receipt"
                                              className="max-h-40 mx-auto"
                                            />
                                          </div>
                                          <Button variant="outline" size="sm" className="w-full">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download Receipt
                                          </Button>
                                        </div>
                                      )}

                                      <h3 className="text-lg font-semibold mb-4">Actions</h3>
                                      <div className="space-y-3">
                                        {selectedAmendment.status === "pending" && (
                                          <Button
                                            className="w-full"
                                            onClick={() => updateAmendmentStatus(selectedAmendment.id, "in_review")}
                                          >
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
                                            <Button
                                              className="w-full"
                                              onClick={() => requestPayment(selectedAmendment.id)}
                                            >
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
                                          <Button
                                            className="w-full"
                                            onClick={() => approvePayment(selectedAmendment.id)}
                                          >
                                            Approve Payment & Complete
                                          </Button>
                                        )}

                                        {selectedAmendment.status === "waiting_for_payment" && (
                                          <div className="p-3 bg-yellow-50 rounded-lg text-center">
                                            Waiting for client payment
                                          </div>
                                        )}

                                        {selectedAmendment.status === "approved" && (
                                          <div className="p-3 bg-green-50 rounded-lg text-center">
                                            Amendment approved and waiting for client to close
                                          </div>
                                        )}

                                        {selectedAmendment.status === "rejected" && (
                                          <div className="p-3 bg-red-50 rounded-lg text-center">Amendment rejected</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Amendments</h2>
            {loading ? (
              <p className="text-center py-4">Loading pending amendments...</p>
            ) : (
              <div className="space-y-4">
                {filteredAmendments
                  .filter((a) => a.status === "pending" || a.status === "in_review")
                  .map((amendment) => (
                    <div key={amendment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{amendment.type}</h3>
                          <p className="text-sm text-gray-500">
                            From {amendment.userName} • {new Date(amendment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(amendment.status)}
                      </div>
                      <p className="text-sm mb-3">{amendment.details}</p>
                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedAmendment(amendment)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">{/* Same dialog content as above */}</DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                {filteredAmendments.filter((a) => a.status === "pending" || a.status === "in_review").length === 0 && (
                  <p className="text-center py-4">No pending amendments found</p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-0">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Related Amendments</h2>
            {loading ? (
              <p className="text-center py-4">Loading payment amendments...</p>
            ) : (
              <div className="space-y-4">
                {filteredAmendments
                  .filter((a) => a.status === "waiting_for_payment" || a.status === "payment_received")
                  .map((amendment) => (
                    <div key={amendment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{amendment.type}</h3>
                          <p className="text-sm text-gray-500">
                            From {amendment.userName} • {new Date(amendment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(amendment.status)}
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm">{amendment.details}</p>
                        {amendment.paymentAmount && <p className="font-bold">${amendment.paymentAmount.toFixed(2)}</p>}
                      </div>
                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedAmendment(amendment)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">{/* Same dialog content as above */}</DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                {filteredAmendments.filter((a) => a.status === "waiting_for_payment" || a.status === "payment_received")
                  .length === 0 && <p className="text-center py-4">No payment-related amendments found</p>}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Approved Amendments</h2>
            {loading ? (
              <p className="text-center py-4">Loading approved amendments...</p>
            ) : (
              <div className="space-y-4">
                {filteredAmendments
                  .filter((a) => a.status === "approved")
                  .map((amendment) => (
                    <div key={amendment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{amendment.type}</h3>
                          <p className="text-sm text-gray-500">
                            From {amendment.userName} • Approved on {new Date(amendment.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(amendment.status)}
                      </div>
                      <p className="text-sm mb-3">{amendment.details}</p>
                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedAmendment(amendment)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">{/* Same dialog content as above */}</DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                {filteredAmendments.filter((a) => a.status === "approved").length === 0 && (
                  <p className="text-center py-4">No approved amendments found</p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

