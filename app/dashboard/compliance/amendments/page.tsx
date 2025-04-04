"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, PenTool, Upload, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

// Define a proper type for Amendment with expanded status options
interface Amendment {
  id: string
  type: string
  details: string
  status:
    | "pending"
    | "in_review"
    | "waiting_for_payment"
    | "payment_confirmation_pending"
    | "payment_received"
    | "approved"
    | "rejected"
    | "amendment_in_progress"
    | "amendment_resolved"
    | "closed"
  createdAt: string
  updatedAt: string
  documentUrl?: string
  receiptUrl?: string
  paymentAmount?: number | string
  notes?: string
}

export default function AmendmentsPage() {
  const [amendmentText, setAmendmentText] = useState("")
  const [amendmentType, setAmendmentType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [myAmendments, setMyAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { data: session } = useSession()
  const [closedAmendments, setClosedAmendments] = useState<Amendment[]>([])

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyAmendments()
    } else {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Add background refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (session?.user?.id) {
        fetchMyAmendments()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [session?.user?.id])

  const fetchMyAmendments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/amendments")
      if (!response.ok) {
        throw new Error("Failed to fetch amendments")
      }
      const data = await response.json()

      // Store all amendments
      const allAmendments = data.amendments || []

      // Filter active amendments (for the main section)
      const activeAmendments = allAmendments.filter((a: Amendment) => a.status !== "closed")
      setMyAmendments(activeAmendments)

      // Store closed amendments separately
      const closedAmendments = allAmendments.filter((a: Amendment) => a.status === "closed")
      setClosedAmendments(closedAmendments)
    } catch (error) {
      console.error("Error fetching amendments:", error)
      toast({
        title: "Error",
        description: "Failed to load your amendments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAmendmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amendmentType) {
      toast({
        title: "Error",
        description: "Please select an amendment type",
        variant: "destructive",
      })
      return
    }

    if (!amendmentText.trim()) {
      toast({
        title: "Error",
        description: "Please provide amendment details",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("type", amendmentType)
      formData.append("details", amendmentText)
      if (file) {
        formData.append("document", file)
      }

      const response = await fetch("/api/amendments", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to submit amendment")
      }

      const data = await response.json()

      // Add the new amendment to our list
      setMyAmendments((prev) => [data.amendment, ...prev])

      // Reset form
      setAmendmentText("")
      setAmendmentType("")
      setFile(null)

      toast({
        title: "Success",
        description: "Your amendment has been submitted successfully",
      })
    } catch (error) {
      console.error("Error submitting amendment:", error)
      toast({
        title: "Error",
        description: "Failed to submit your amendment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadReceipt = async (amendmentId: string) => {
    if (!receiptFile) {
      toast({
        title: "Error",
        description: "Please select a receipt file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      // Change from "payment_received" to "payment_confirmation_pending"
      formData.append("status", "payment_confirmation_pending")
      formData.append("receipt", receiptFile)

      const response = await fetch(`/api/amendments/${amendmentId}`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload receipt")
      }

      const data = await response.json()

      // Update the amendment in our list
      setMyAmendments((prev) => prev.map((a) => (a.id === amendmentId ? data.amendment : a)))

      setReceiptFile(null)

      toast({
        title: "Success",
        description: "Your payment receipt has been uploaded and is pending verification",
      })
    } catch (error) {
      console.error("Error uploading receipt:", error)
      toast({
        title: "Error",
        description: "Failed to upload your receipt",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseAmendment = async (amendmentId: string) => {
    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("status", "closed")

      const response = await fetch(`/api/amendments/${amendmentId}`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to close amendment")
      }

      // Remove the amendment from our list
      setMyAmendments((prev) => prev.filter((a) => a.id !== amendmentId))

      toast({
        title: "Success",
        description: "Amendment has been closed successfully",
      })
    } catch (error) {
      console.error("Error closing amendment:", error)
      toast({
        title: "Error",
        description: "Failed to close the amendment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format currency amounts safely
  const formatCurrency = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00"

    // Convert to number if it's not already
    const numAmount = typeof amount === "number" ? amount : Number(amount)

    // Check if conversion resulted in a valid number
    if (isNaN(numAmount)) return "$0.00"

    // Now safely call toFixed
    return `$${numAmount.toFixed(2)}`
  }

  // Helper function to get status badge
  const getStatusBadge = (status: Amendment["status"]) => {
    const statusConfig = {
      pending: { bg: "bg-blue-100", text: "text-blue-800", label: "Pending" },
      in_review: { bg: "bg-purple-100", text: "text-purple-800", label: "In Review" },
      waiting_for_payment: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Payment Required" },
      payment_confirmation_pending: { bg: "bg-blue-100", text: "text-blue-800", label: "Payment Verification Pending" },
      payment_received: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Payment Received" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      amendment_in_progress: { bg: "bg-purple-100", text: "text-purple-800", label: "Amendment In Progress" },
      amendment_resolved: { bg: "bg-green-100", text: "text-green-800", label: "Amendment Resolved" },
      closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
    }

    const config = statusConfig[status]

    return (
      <span className={`text-xs px-2 py-1 ${config.bg} ${config.text} rounded-full whitespace-nowrap`}>
        {config.label}
      </span>
    )
  }

  // Helper function to get status icon
  const getStatusIcon = (status: Amendment["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
      case "in_review":
        return <FileText className="h-5 w-5 text-purple-500 flex-shrink-0" />
      case "waiting_for_payment":
        return <DollarSign className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      case "payment_confirmation_pending":
        return <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-indigo-500 flex-shrink-0" />
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      case "amendment_in_progress":
        return <PenTool className="h-5 w-5 text-purple-500 flex-shrink-0" />
      case "amendment_resolved":
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      case "closed":
        return <CheckCircle className="h-5 w-5 text-gray-500 flex-shrink-0" />
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 sm:mb-32 md:mb-44 max-w-full overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Amendments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        <Card className="p-4 sm:p-6 overflow-hidden">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-[#22c984]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 truncate">Submit Amendment</h3>
              <p className="text-sm sm:text-base text-gray-600">Update your company information</p>
            </div>
          </div>

          <form onSubmit={handleAmendmentSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="amendment-type" className="text-sm sm:text-base">
                Amendment Type
              </Label>
              <select
                id="amendment-type"
                className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 sm:py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={amendmentType}
                onChange={(e) => setAmendmentType(e.target.value)}
              >
                <option value="">Select amendment type</option>
                <option value="Company Name Change">Company Name Change</option>
                <option value="Address Change">Address Change</option>
                <option value="Ownership Change">Ownership Change</option>
                <option value="Business Purpose Change">Business Purpose Change</option>
                <option value="Other Amendment">Other Amendment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="amendment-text" className="text-sm sm:text-base">
                Amendment Details
              </Label>
              <Textarea
                id="amendment-text"
                placeholder="Describe your amendment..."
                value={amendmentText}
                onChange={(e) => setAmendmentText(e.target.value)}
                rows={4}
                className="text-sm sm:text-base resize-none"
              />
            </div>
            <div>
              <Label htmlFor="amendment-file" className="text-sm sm:text-base">
                Supporting Documents (Optional)
              </Label>
              <Input
                id="amendment-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm sm:text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#22c984] hover:bg-[#1a8055] text-sm sm:text-base h-9 sm:h-10"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Amendment"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          {/* Status of My Amendments - Only show if there are amendments */}
          {myAmendments.length > 0 && (
            <Card className="p-4 sm:p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold truncate">Status of My Amendments</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMyAmendments}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${loading ? "animate-spin" : ""}`}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 21h5v-5"></path>
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
              <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {myAmendments.map((amendment) => (
                  <div key={amendment.id} className="border rounded-lg p-3 sm:p-4 overflow-hidden">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {getStatusIcon(amendment.status)}
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{amendment.type}</p>
                          <p className="text-xs text-gray-600">
                            Submitted: {new Date(amendment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(amendment.status)}</div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 break-words line-clamp-3">
                      {amendment.details}
                    </p>

                    {/* Payment section - only show for amendments waiting for payment */}
                    {amendment.status === "waiting_for_payment" && amendment.paymentAmount && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                          <p className="text-xs sm:text-sm font-medium">Payment Required:</p>
                          <p className="font-bold text-sm sm:text-base">{formatCurrency(amendment.paymentAmount)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`receipt-${amendment.id}`} className="text-xs sm:text-sm">
                            Upload Payment Receipt
                          </Label>
                          <Input
                            id={`receipt-${amendment.id}`}
                            type="file"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                            className="text-xs sm:text-sm h-8 sm:h-9"
                          />
                          <Button
                            onClick={() => handleUploadReceipt(amendment.id)}
                            className="w-full bg-[#22c984] hover:bg-[#1a8055] text-xs sm:text-sm h-8 sm:h-9"
                            disabled={!receiptFile || loading}
                          >
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {loading ? "Uploading..." : "Upload Receipt"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Payment verification pending section */}
                    {amendment.status === "payment_confirmation_pending" && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-blue-800">Your payment receipt is being verified</p>
                        </div>
                      </div>
                    )}

                    {/* Amendment in progress section */}
                    {amendment.status === "amendment_in_progress" && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-purple-800">Your amendment is being processed</p>
                        </div>
                      </div>
                    )}

                    {/* Amendment resolved section */}
                    {amendment.status === "amendment_resolved" && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-green-800">Your amendment has been completed</p>
                        </div>
                      </div>
                    )}

                    {/* Close button - only show for approved or resolved amendments */}
                    {(amendment.status === "approved" || amendment.status === "amendment_resolved") && (
                      <Button
                        onClick={() => handleCloseAmendment(amendment.id)}
                        variant="outline"
                        className="w-full mt-2 sm:mt-3 text-xs sm:text-sm h-8 sm:h-9"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Close Amendment"}
                      </Button>
                    )}

                    {/* Notes section - show if there are notes */}
                    {amendment.notes && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium">Notes:</p>
                        <p className="text-xs sm:text-sm text-gray-700 break-words">{amendment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Closed Amendments */}
          <Card className="p-4 sm:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold truncate">Recent Closed Amendments</h3>
            </div>

            {closedAmendments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                {closedAmendments.slice(0, 4).map((amendment) => (
                  <div key={`recent-${amendment.id}`} className="border rounded-lg p-3 sm:p-4 overflow-hidden">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {getStatusIcon(amendment.status)}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{amendment.type}</p>
                          <p className="text-xs text-gray-600">
                            Closed: {new Date(amendment.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(amendment.status)}</div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 truncate">{amendment.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm sm:text-base">No closed amendments found</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

