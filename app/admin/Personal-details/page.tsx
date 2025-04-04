"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface Member {
  id: string
  memberName: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl?: string
}

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
  members?: Member[]
  user?: {
    email: string
    name: string | null
  }
}

interface PaginationResponse {
  personalDetails: PersonalDetails[]
  totalItems: number
  totalPages: number
  currentPage: number
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    fetchPersonalDetails(1)
  }, [activeTab])

  // Add background refresh every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Background refresh triggered")
      fetchPersonalDetails(currentPage)
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(intervalId) // Clean up on unmount
  }, [currentPage, activeTab])

  // Update the fetchPersonalDetails function to log the response data
  const fetchPersonalDetails = async (page: number) => {
    if (!isRefreshing) setIsLoading(true)
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/admin/personal-details?status=${activeTab}&page=${page}&limit=${itemsPerPage}`)
      if (!response.ok) {
        throw new Error("Failed to fetch personal details")
      }
      const data: PaginationResponse = await response.json()
      console.log("Fetched personal details:", data.personalDetails) // Add this line to debug
      setPersonalDetails(data.personalDetails)
      setTotalItems(data.totalItems)
      setTotalPages(data.totalPages)
      setCurrentPage(data.currentPage)
    } catch (error) {
      console.error("Error fetching personal details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch personal details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Update the handleViewDetails function to log the selected details
  const handleViewDetails = (details: PersonalDetails) => {
    console.log("Selected details:", details) // Add this line to debug
    console.log("Members:", details.members) // Add this line to debug
    setSelectedDetails(details)
    setAdminNotes(details.adminNotes || "")
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    fetchPersonalDetails(page)
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
      fetchPersonalDetails(currentPage)
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
      // Log what we're sending for debugging
      console.log("Sending reject request with:", { adminNotes })

      const response = await fetch(`/api/admin/personal-details/${selectedDetails.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Reject response error:", data)
        throw new Error(data.error || "Failed to reject personal details")
      }

      toast({
        title: "Success",
        description: "Personal details rejected successfully",
      })

      setSelectedDetails(null)
      fetchPersonalDetails(currentPage)
    } catch (error) {
      console.error("Error rejecting personal details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject personal details",
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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      // Log what we're deleting for debugging
      console.log("Deleting personal details with ID:", deletingId)

      const response = await fetch(`/api/admin/personal-details/${deletingId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Delete response error:", data)
        throw new Error(data.error || "Failed to delete personal details")
      }

      toast({
        title: "Success",
        description: "Personal details deleted successfully",
      })

      // Close dialogs and refresh data
      setDeleteDialogOpen(false)
      setDeletingId(null)
      if (selectedDetails?.id === deletingId) {
        setSelectedDetails(null)
      }
      fetchPersonalDetails(currentPage)
    } catch (error) {
      console.error("Error deleting personal details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete personal details",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = []

    // First page and previous page buttons
    buttons.push(
      <Button
        key="first"
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className="h-7 w-7 sm:h-8 sm:w-8"
      >
        <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">First page</span>
      </Button>,
    )

    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-7 w-7 sm:h-8 sm:w-8"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Previous page</span>
      </Button>,
    )

    // Page number buttons - show fewer on mobile
    const startPage = Math.max(1, currentPage - (window.innerWidth < 640 ? 1 : 2))
    const endPage = Math.min(totalPages, startPage + (window.innerWidth < 640 ? 2 : 4))

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="h-7 w-7 sm:h-8 sm:w-8 text-xs sm:text-sm"
        >
          {i}
        </Button>,
      )
    }

    // Next page and last page buttons
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-7 w-7 sm:h-8 sm:w-8"
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Next page</span>
      </Button>,
    )

    buttons.push(
      <Button
        key="last"
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-7 w-7 sm:h-8 sm:w-8"
      >
        <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Last page</span>
      </Button>,
    )

    return buttons
  }

  return (
    <div className="px-3 sm:px-4 md:px-[3%] py-6 sm:py-8 md:py-10 mb-20 sm:mb-30 md:mb-40 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Personal Details Verification</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPersonalDetails(currentPage)}
          disabled={isRefreshing}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          )}
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto flex">
          <TabsTrigger value="pending" className="flex-1 sm:flex-none">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 sm:flex-none">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 sm:flex-none">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-48 sm:h-64">
              <div className="relative w-16 sm:w-24 h-16 sm:h-24">
                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-primary animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-4 border-l-4 border-primary/30 animate-ping"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 sm:h-10 w-8 sm:w-10 text-primary animate-pulse" />
                </div>
              </div>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg font-medium text-primary animate-pulse">
                Loading verification data...
              </p>
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
              <CardContent className="p-0 sm:p-6">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] sm:w-auto">Client Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                        <TableHead className="hidden lg:table-cell">Redirect</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personalDetails.map((details) => (
                        <TableRow key={details.id}>
                          <TableCell className="font-medium">{details.clientName}</TableCell>
                          <TableCell className="hidden sm:table-cell">{details.companyName}</TableCell>
                          <TableCell>{getStatusBadge(details.status)}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(details.createdAt)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`redirect-${details.id}`}
                                checked={details.isRedirectDisabled}
                                onCheckedChange={() => handleToggleRedirect(details.id, details.isRedirectDisabled)}
                              />
                              <Label htmlFor={`redirect-${details.id}`} className="hidden xl:inline">
                                {details.isRedirectDisabled ? "Dashboard Access ON" : "Dashboard Access OFF"}
                              </Label>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(details)}
                                className="w-full sm:w-auto"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                                onClick={() => handleDeleteClick(details.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              {totalPages > 1 && (
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center border-t px-4 py-3 sm:px-6 sm:py-4 gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Showing{" "}
                    <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
                    <span className="font-medium">{totalItems}</span> entries
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">{renderPaginationButtons()}</div>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {selectedDetails && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedDetails(null)}>
          <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle>Personal Details Review</DialogTitle>
              <DialogDescription>
                Review the personal details and documents submitted by {selectedDetails.clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Client Name</h3>
                  <p className="break-words">{selectedDetails.clientName}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Company Name</h3>
                  <p className="break-words">{selectedDetails.companyName}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Current Address</h3>
                  <p className="whitespace-pre-line break-words">{selectedDetails.currentAddress}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Business Purpose</h3>
                  <p className="whitespace-pre-line break-words">{selectedDetails.businessPurpose}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p className="break-words">{selectedDetails.user?.email}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Submitted On</h3>
                  <p>{formatDate(selectedDetails.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-medium mb-2">ID Card (Front)</h3>
                  <div className="relative h-32 sm:h-40 border rounded overflow-hidden">
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
                  <div className="relative h-32 sm:h-40 border rounded overflow-hidden">
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
                  <div className="relative h-32 sm:h-40 border rounded overflow-hidden">
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

            {/* Additional Members Section */}
            {selectedDetails.members && selectedDetails.members.length > 0 && (
              <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Additional Members</h3>

                <Accordion type="single" collapsible className="w-full">
                  {selectedDetails.members.map((member, index) => (
                    <AccordionItem key={member.id} value={member.id}>
                      <AccordionTrigger className="hover:bg-gray-50 px-3 sm:px-4 rounded-lg">
                        <span className="text-left text-sm sm:text-base">
                          Member {index + 1}: {member.memberName}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-xs sm:text-sm">ID Card (Front)</h4>
                            <div className="relative h-24 sm:h-32 border rounded overflow-hidden">
                              <img
                                src={member.idCardFrontUrl || "/placeholder.svg"}
                                alt={`${member.memberName} ID Card Front`}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => {
                                  setViewingImage(member.idCardFrontUrl)
                                  setOpenDialog(true)
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 text-xs sm:text-sm">ID Card (Back)</h4>
                            <div className="relative h-24 sm:h-32 border rounded overflow-hidden">
                              <img
                                src={member.idCardBackUrl || "/placeholder.svg"}
                                alt={`${member.memberName} ID Card Back`}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => {
                                  setViewingImage(member.idCardBackUrl)
                                  setOpenDialog(true)
                                }}
                              />
                            </div>
                          </div>

                          {member.passportUrl && (
                            <div>
                              <h4 className="font-medium mb-2 text-xs sm:text-sm">Passport</h4>
                              <div className="relative h-24 sm:h-32 border rounded overflow-hidden">
                                <img
                                  src={member.passportUrl || "/placeholder.svg"}
                                  alt={`${member.memberName} Passport`}
                                  className="w-full h-full object-contain cursor-pointer"
                                  onClick={() => {
                                    setViewingImage(member.passportUrl || null)
                                    setOpenDialog(true)
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

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

            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 sm:mt-6">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Switch
                  id="toggle-redirect"
                  checked={selectedDetails.isRedirectDisabled}
                  onCheckedChange={() => handleToggleRedirect(selectedDetails.id, selectedDetails.isRedirectDisabled)}
                />
                <Label htmlFor="toggle-redirect">
                  {selectedDetails.isRedirectDisabled ? "Dashboard Access ON" : "Dashboard Access OFF"}
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                  onClick={() => handleDeleteClick(selectedDetails.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                {selectedDetails.status === "pending" && (
                  <>
                    <Button variant="destructive" onClick={handleReject} className="w-full sm:w-auto">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button variant="default" onClick={handleApprove} className="w-full sm:w-auto">
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
        <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-auto p-1 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="relative h-[40vh] sm:h-[50vh] md:h-[70vh] w-full">
              <img src={viewingImage || "/placeholder.svg"} alt="Document" className="w-full h-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this personal details record? This action cannot be undone and will
              permanently remove all associated data, including member information and uploaded documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

