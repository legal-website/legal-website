"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react"

interface PersonalDetails {
  id: string
  userId: string
  clientName: string
  companyName: string
  currentAddress: string
  businessPurpose: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl: string
  status: string
  adminNotes: string | null
  isRedirectDisabled: boolean
  createdAt: string
  updatedAt: string
  user?: {
    email: string
    name: string | null
  }
}

export default function AdminPersonalDetailsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails[]>([])
  const [selectedDetails, setSelectedDetails] = useState<PersonalDetails | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [openDialog, setOpenDialog] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  useEffect(() => {
    fetchPersonalDetails()
  }, [activeTab])

  const fetchPersonalDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/personal-details?status=${activeTab}`)
      if (!response.ok) {
        throw new Error("Failed to fetch personal details")
      }
      const data = await response.json()
      setPersonalDetails(data.personalDetails)
    } catch (error) {
      console.error("Error fetching personal details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch personal details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (details: PersonalDetails) => {
    setSelectedDetails(details)
    setAdminNotes(details.adminNotes || "")
  }

  const handleApprove = async () => {
    if (!selectedDetails) return

    try {
      const response = await fetch(`/api/admin/personal-details/${selectedDetails.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve personal details")
      }

      toast({
        title: "Success",
        description: "Personal details approved successfully",
      })

      setSelectedDetails(null)
      fetchPersonalDetails()
    } catch (error) {
      console.error("Error approving personal details:", error)
      toast({
        title: "Error",
        description: "Failed to approve personal details",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!selectedDetails) return

    try {
      const response = await fetch(`/api/admin/personal-details/${selectedDetails.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject personal details")
      }

      toast({
        title: "Success",
        description: "Personal details rejected successfully",
      })

      setSelectedDetails(null)
      fetchPersonalDetails()
    } catch (error) {
      console.error("Error rejecting personal details:", error)
      toast({
        title: "Error",
        description: "Failed to reject personal details",
        variant: "destructive",
      })
    }
  }

  const handleToggleRedirect = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/personal-details/${id}/toggle-redirect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRedirectDisabled: !currentValue }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle redirect")
      }

      toast({
        title: "Success",
        description: `Redirect ${!currentValue ? "disabled" : "enabled"} successfully`,
      })

      // Update the local state
      setPersonalDetails((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRedirectDisabled: !currentValue } : item)),
      )

      if (selectedDetails?.id === id) {
        setSelectedDetails((prev) => (prev ? { ...prev, isRedirectDisabled: !currentValue } : null))
      }
    } catch (error) {
      console.error("Error toggling redirect:", error)
      toast({
        title: "Error",
        description: "Failed to toggle redirect",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Details Verification</h1>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : personalDetails.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No {activeTab} personal details found</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Verifications</CardTitle>
                <CardDescription>Review and manage user personal details verification requests</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto">
                <div className="w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Redirect</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personalDetails.map((details) => (
                        <TableRow key={details.id}>
                          <TableCell className="font-medium">{details.clientName}</TableCell>
                          <TableCell>{details.companyName}</TableCell>
                          <TableCell>{getStatusBadge(details.status)}</TableCell>
                          <TableCell>{formatDate(details.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`redirect-${details.id}`}
                                checked={details.isRedirectDisabled}
                                onCheckedChange={() => handleToggleRedirect(details.id, details.isRedirectDisabled)}
                              />
                              <Label htmlFor={`redirect-${details.id}`}>
                                {details.isRedirectDisabled ? "Disabled" : "Enabled"}
                              </Label>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(details)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {selectedDetails && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedDetails(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Personal Details Review</DialogTitle>
              <DialogDescription>
                Review the personal details and documents submitted by {selectedDetails.clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Client Name</h3>
                  <p>{selectedDetails.clientName}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Company Name</h3>
                  <p>{selectedDetails.companyName}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Current Address</h3>
                  <p className="whitespace-pre-line">{selectedDetails.currentAddress}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Business Purpose</h3>
                  <p className="whitespace-pre-line">{selectedDetails.businessPurpose}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p>{selectedDetails.user?.email}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Submitted On</h3>
                  <p>{formatDate(selectedDetails.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">ID Card (Front)</h3>
                  <div className="relative h-40 border rounded overflow-hidden">
                    <img
                      src={selectedDetails.idCardFrontUrl || "/placeholder.svg"}
                      alt="ID Card Front"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => {
                        setViewingImage(selectedDetails.idCardFrontUrl)
                        setOpenDialog(true)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">ID Card (Back)</h3>
                  <div className="relative h-40 border rounded overflow-hidden">
                    <img
                      src={selectedDetails.idCardBackUrl || "/placeholder.svg"}
                      alt="ID Card Back"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => {
                        setViewingImage(selectedDetails.idCardBackUrl)
                        setOpenDialog(true)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Passport</h3>
                  <div className="relative h-40 border rounded overflow-hidden">
                    <img
                      src={selectedDetails.passportUrl || "/placeholder.svg"}
                      alt="Passport"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => {
                        setViewingImage(selectedDetails.passportUrl)
                        setOpenDialog(true)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this verification"
                rows={3}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Switch
                  id="toggle-redirect"
                  checked={selectedDetails.isRedirectDisabled}
                  onCheckedChange={() => handleToggleRedirect(selectedDetails.id, selectedDetails.isRedirectDisabled)}
                />
                <Label htmlFor="toggle-redirect">
                  {selectedDetails.isRedirectDisabled ? "Redirect Disabled" : "Redirect Enabled"}
                </Label>
              </div>

              <div className="flex space-x-2 w-full sm:w-auto">
                {selectedDetails.status === "pending" && (
                  <>
                    <Button variant="destructive" onClick={handleReject} className="flex-1 sm:flex-none">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button variant="default" onClick={handleApprove} className="flex-1 sm:flex-none">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                {selectedDetails.status === "rejected" && (
                  <Button variant="default" onClick={handleApprove} className="w-full sm:w-auto">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedDetails.status === "approved" && (
                  <Button variant="destructive" onClick={handleReject} className="w-full sm:w-auto">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-1 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="relative h-[50vh] sm:h-[70vh] w-full">
              <img src={viewingImage || "/placeholder.svg"} alt="Document" className="w-full h-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

