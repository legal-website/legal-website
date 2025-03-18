"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "@/lib/toast-utils"
import { Loader2, FileText, Upload, Clock, AlertCircle, CheckCircle, DollarSign } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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

// Define Amendment Status enum
export enum AmendmentStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  WAITING_FOR_PAYMENT = "waiting_for_payment",
  PAYMENT_CONFIRMATION_PENDING = "payment_confirmation_pending",
  PAYMENT_RECEIVED = "payment_received",
  APPROVED = "approved",
  REJECTED = "rejected",
  AMENDMENT_IN_PROGRESS = "amendment_in_progress",
  AMENDMENT_RESOLVED = "amendment_resolved",
  CLOSED = "closed",
}

export default function ComplianceAmendmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedAmendmentId, setSelectedAmendmentId] = useState<string | null>(null)
  const [amendmentType, setAmendmentType] = useState("")
  const [amendmentDetails, setAmendmentDetails] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchAmendments()
    }
  }, [session])

  const fetchAmendments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/amendments")

      if (!response.ok) {
        throw new Error("Failed to fetch amendments")
      }

      const data = await response.json()
      setAmendments(data.amendments || [])
    } catch (err) {
      console.error("Error fetching amendments:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAmendment = async () => {
    if (!amendmentType || !amendmentDetails) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const formData = new FormData()
      formData.append("type", amendmentType)
      formData.append("details", amendmentDetails)

      if (selectedFile) {
        formData.append("document", selectedFile)
      }

      const response = await fetch("/api/user/amendments", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create amendment")
      }

      toast({
        title: "Amendment created",
        description: "Your amendment request has been submitted successfully",
      })

      setIsDialogOpen(false)
      setAmendmentType("")
      setAmendmentDetails("")
      setSelectedFile(null)

      // Refresh the amendments list
      fetchAmendments()
    } catch (err) {
      console.error("Error creating amendment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create amendment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadReceipt = async () => {
    if (!selectedReceipt || !selectedAmendmentId) {
      toast({
        title: "Missing information",
        description: "Please select a receipt file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("receipt", selectedReceipt)

      const response = await fetch(`/api/user/amendments/${selectedAmendmentId}/receipt`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload receipt")
      }

      toast({
        title: "Receipt uploaded",
        description: "Your payment receipt has been uploaded successfully",
      })

      setIsUploadDialogOpen(false)
      setSelectedReceipt(null)
      setSelectedAmendmentId(null)

      // Refresh the amendments list
      fetchAmendments()
    } catch (err) {
      console.error("Error uploading receipt:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to upload receipt",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedReceipt(e.target.files[0])
    }
  }

  const openUploadDialog = (amendmentId: string) => {
    setSelectedAmendmentId(amendmentId)
    setSelectedReceipt(null)
    setIsUploadDialogOpen(true)
  }

  // Format currency helper
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "$0.00"
    return `$${amount.toFixed(2)}`
  }

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Filter amendments that are not closed for Status section
  const activeAmendments = amendments.filter((amendment) => amendment.status !== AmendmentStatus.CLOSED)

  // Get the 5 most recent amendments for Recent section
  const recentAmendments = [...amendments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (!session) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your compliance amendments.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/auth/signin")}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Compliance Amendments</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Request Amendment</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAmendments} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading your amendments...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Status of My Amendments</CardTitle>
              <CardDescription>Track the status of your compliance amendment requests</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAmendments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You don't have any active amendments</p>
                  <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} className="mt-4">
                    Request Amendment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAmendments.map((amendment) => (
                    <Card key={amendment.id} className="overflow-hidden border-l-2 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{amendment.type}</CardTitle>
                          <StatusBadge status={amendment.status} />
                        </div>
                        <CardDescription>Submitted on {formatDate(amendment.createdAt)}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Details:</h4>
                          <p className="text-sm text-gray-600 mt-1">{amendment.details}</p>
                        </div>

                        {amendment.documentUrl && (
                          <div className="mb-3 p-2 bg-blue-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-blue-500" /> Document:
                            </h4>
                            <a
                              href={amendment.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                            >
                              View Document
                            </a>
                          </div>
                        )}

                        {amendment.paymentAmount !== null && (
                          <div className="mb-3 p-2 bg-yellow-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-yellow-500" /> Payment Required:
                            </h4>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {formatCurrency(amendment.paymentAmount)}
                            </p>

                            {amendment.status === AmendmentStatus.WAITING_FOR_PAYMENT && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => openUploadDialog(amendment.id)}
                              >
                                <Upload className="h-4 w-4 mr-1" /> Upload Receipt
                              </Button>
                            )}
                          </div>
                        )}

                        {amendment.notes && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700">Notes from Admin:</h4>
                            <p className="text-sm text-gray-600 mt-1">{amendment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Amendments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Amendments</CardTitle>
              <CardDescription>Your 5 most recent amendment requests</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAmendments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You don't have any amendments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAmendments.map((amendment) => (
                    <div
                      key={amendment.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{amendment.type}</span>
                        <span className="text-sm text-gray-500">{formatDate(amendment.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={amendment.status} />
                        {amendment.status === AmendmentStatus.CLOSED && (
                          <Badge variant="outline" className="bg-gray-100">
                            Closed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Amendment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Amendment</DialogTitle>
            <DialogDescription>Fill in the details for your compliance amendment request.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amendmentType" className="text-right">
                Type
              </Label>
              <Input
                id="amendmentType"
                placeholder="e.g., Document Update, Legal Review"
                value={amendmentType}
                onChange={(e) => setAmendmentType(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amendmentDetails" className="text-right">
                Details
              </Label>
              <Textarea
                id="amendmentDetails"
                placeholder="Describe your amendment request in detail"
                value={amendmentDetails}
                onChange={(e) => setAmendmentDetails(e.target.value)}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="documentFile" className="text-right">
                Document
              </Label>
              <div className="col-span-3">
                <Input id="documentFile" type="file" onChange={handleFileChange} className="col-span-3" />
                <p className="text-xs text-gray-500 mt-1">Optional. Upload any relevant document (PDF, DOCX, etc.)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateAmendment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Payment Receipt</DialogTitle>
            <DialogDescription>
              Please upload a receipt or proof of payment for your amendment request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receiptFile" className="text-right">
                Receipt
              </Label>
              <div className="col-span-3">
                <Input id="receiptFile" type="file" onChange={handleReceiptChange} className="col-span-3" />
                <p className="text-xs text-gray-500 mt-1">Upload your payment receipt (PDF, JPG, PNG)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUploadReceipt} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Receipt"
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
  let label = status.replace(/_/g, " ")

  // Capitalize first letter of each word
  label = label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  let icon = null

  switch (status) {
    case AmendmentStatus.APPROVED:
      variant = "default" // green
      icon = <CheckCircle className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.REJECTED:
      variant = "destructive" // red
      icon = <AlertCircle className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.PENDING:
      variant = "outline"
      icon = <Clock className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.IN_REVIEW:
      variant = "secondary" // gray
      icon = <Clock className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.WAITING_FOR_PAYMENT:
      variant = "secondary" // gray
      icon = <DollarSign className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.PAYMENT_CONFIRMATION_PENDING:
      variant = "outline" // outline
      icon = <DollarSign className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.PAYMENT_RECEIVED:
      variant = "default" // green
      icon = <CheckCircle className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.AMENDMENT_IN_PROGRESS:
      variant = "secondary" // gray
      icon = <Clock className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.AMENDMENT_RESOLVED:
      variant = "default" // green
      icon = <CheckCircle className="h-3 w-3 mr-1" />
      break
    case AmendmentStatus.CLOSED:
      variant = "secondary" // gray
      break
  }

  return (
    <Badge variant={variant} className="capitalize flex items-center">
      {icon}
      {label}
    </Badge>
  )
}

