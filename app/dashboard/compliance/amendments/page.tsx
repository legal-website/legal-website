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

interface Amendment {
  id: string
  type: string
  details: string
  status: "pending" | "in_review" | "waiting_for_payment" | "payment_received" | "approved" | "rejected" | "closed"
  createdAt: string
  updatedAt: string
  documentUrl?: string
  receiptUrl?: string
  paymentAmount?: number
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

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyAmendments()
    } else {
      setLoading(false)
    }
  }, [session?.user?.id])

  const fetchMyAmendments = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would be an API call
      // For now, we'll simulate with mock data
      const mockAmendments: Amendment[] = [
        {
          id: "amd-001",
          type: "Company Name Change",
          details: "Change company name from ABC LLC to XYZ Enterprises LLC",
          status: "pending",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "amd-002",
          type: "Address Change",
          details: "Update business address to 123 New Street, New City, NY 10001",
          status: "waiting_for_payment",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          paymentAmount: 150,
        },
      ]

      // Filter out closed amendments
      const activeAmendments = mockAmendments.filter((a) => a.status !== "closed")
      setMyAmendments(activeAmendments)
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

      // In a real implementation, this would be an API call to submit the amendment
      // For now, we'll simulate success and add to our local state

      const newAmendment: Amendment = {
        id: `amd-${Math.floor(Math.random() * 1000)}`,
        type: amendmentType,
        details: amendmentText,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add the new amendment to our list
      setMyAmendments((prev) => [newAmendment, ...prev])

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

      // In a real implementation, this would be an API call to upload the receipt
      // For now, we'll simulate success and update our local state

      // Update the amendment status
      setMyAmendments((prev) =>
        prev.map((a) =>
          a.id === amendmentId
            ? {
                ...a,
                status: "payment_received",
                receiptUrl: URL.createObjectURL(receiptFile),
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      )

      setReceiptFile(null)

      toast({
        title: "Success",
        description: "Your payment receipt has been uploaded successfully",
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

      // In a real implementation, this would be an API call to close the amendment
      // For now, we'll simulate success and update our local state

      // Remove the amendment from our list (to simulate it disappearing)
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

    return <span className={`text-xs px-2 py-1 ${config.bg} ${config.text} rounded-full`}>{config.label}</span>
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
    <div className="p-8 mb-44">
      <h1 className="text-3xl font-bold mb-6">Amendments</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PenTool className="h-6 w-6 text-[#22c984]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Submit Amendment</h3>
              <p className="text-gray-600">Update your company information</p>
            </div>
          </div>

          <form onSubmit={handleAmendmentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amendment-type">Amendment Type</Label>
              <select
                id="amendment-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              <Label htmlFor="amendment-text">Amendment Details</Label>
              <Textarea
                id="amendment-text"
                placeholder="Describe your amendment..."
                value={amendmentText}
                onChange={(e) => setAmendmentText(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="amendment-file">Supporting Documents (Optional)</Label>
              <Input id="amendment-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" className="w-full bg-[#22c984] hover:bg-[#1a8055]" disabled={loading}>
              {loading ? "Submitting..." : "Submit Amendment"}
            </Button>
          </form>
        </Card>

        <div>
          {/* Status of My Amendments - Only show if there are amendments */}
          {myAmendments.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Status of My Amendments</h3>
              <div className="space-y-4">
                {myAmendments.map((amendment) => (
                  <div key={amendment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(amendment.status)}
                        <div>
                          <p className="font-medium">{amendment.type}</p>
                          <p className="text-xs text-gray-600">
                            Submitted: {new Date(amendment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(amendment.status)}
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{amendment.details}</p>

                    {/* Payment section - only show for amendments waiting for payment */}
                    {amendment.status === "waiting_for_payment" && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">Payment Required:</p>
                          <p className="font-bold">${amendment.paymentAmount?.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`receipt-${amendment.id}`}>Upload Payment Receipt</Label>
                          <Input
                            id={`receipt-${amendment.id}`}
                            type="file"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            onClick={() => handleUploadReceipt(amendment.id)}
                            className="w-full bg-[#22c984] hover:bg-[#1a8055]"
                            disabled={!receiptFile || loading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {loading ? "Uploading..." : "Upload Receipt"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Close button - only show for approved amendments */}
                    {amendment.status === "approved" && (
                      <Button
                        onClick={() => handleCloseAmendment(amendment.id)}
                        variant="outline"
                        className="w-full mt-3"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Close Amendment"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Amendments</h3>
            <div className="space-y-4">
              {[
                { name: "Address Change", date: "Mar 15, 2024", status: "Approved" },
                { name: "Business Purpose Update", date: "Jan 10, 2024", status: "Approved" },
              ].map((amendment) => (
                <div key={amendment.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{amendment.name}</p>
                      <p className="text-xs text-gray-600">{amendment.date}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{amendment.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

