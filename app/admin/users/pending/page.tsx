"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Shield,
  FileText,
  Mail,
  Phone,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Role } from "@prisma/client"

// Define interfaces for type safety
interface Document {
  name: string
  status: "Verified" | "Pending"
}

interface PendingUser {
  id: string
  name: string
  email: string
  company: string
  date: string
  status: string
  documents: Document[]
  notes: string
  riskLevel: "Low" | "Medium" | "High"
}

export default function PendingUsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    industry: "",
    formationDate: "",
    ein: "",
    businessId: "",
    // UI display fields
    serviceStatus: "Pending",
    llcProgress: 10,
  })

  // Fetch pending users
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchPendingUsers()
    }
  }, [sessionStatus, session])

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (!session) {
      router.push("/login?callbackUrl=/admin/users/pending")
      return
    }

    // Only ADMIN users can access this page
    if ((session.user as any).role !== Role.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [session, sessionStatus, router, toast])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)

      // Fetch users with pending status
      const response = await fetch("/api/admin/users?status=pending", {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch pending users")
      }

      const data = await response.json()

      // Format the user data
      const formattedUsers = data.users.map((user: any) => ({
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        company: user.company || "Not specified",
        date: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown",
        status: "Pending",
        documents: [
          { name: "ID Verification", status: "Verified" },
          { name: "Business License", status: "Pending" },
          { name: "Tax ID", status: "Pending" },
        ],
        notes: user.notes || "Applicant has submitted all required documents. Verification in progress.",
        riskLevel: "Low",
      }))

      setPendingUsers(formattedUsers)
    } catch (error) {
      console.error("Error fetching pending users:", error)
      toast({
        title: "Error",
        description: "Failed to load pending users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate a unique business ID
  const generateBusinessId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString()
  }

  const filteredUsers = pendingUsers.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const viewUserDetails = async (user: PendingUser) => {
    try {
      // Fetch business data if it exists
      const response = await fetch(`/api/admin/users/${user.id}/business`)
      let businessData = null

      if (response.ok) {
        const data = await response.json()
        businessData = data.business
      }
      {
        const data = await response.json()
        businessData = data.business
      }

      // Set form data with business info or defaults
      setFormData({
        name: businessData?.name || user.company || "",
        email: businessData?.email || user.email || "",
        phone: businessData?.phone || "",
        address: businessData?.address || "",
        website: businessData?.website || "",
        industry: businessData?.industry || "",
        formationDate: businessData?.formationDate
          ? new Date(businessData.formationDate).toISOString().split("T")[0]
          : "",
        ein: businessData?.ein || "",
        businessId: businessData?.businessId || generateBusinessId(),
        serviceStatus: "Pending",
        llcProgress: 10,
      })

      setSelectedUser(user)
      setShowUserDialog(true)
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, llcProgress: value[0] }))
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      // Update user business information
      const response = await fetch(`/api/admin/users/${selectedUser.id}/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update user business information")
      }

      // Update the user in the list
      setPendingUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                company: formData.name,
              }
            : user,
        ),
      )

      setShowUserDialog(false)

      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s business information has been updated.`,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const approveUser = async (user: PendingUser) => {
    try {
      // Update user status to Active
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Active" }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve user")
      }

      // Remove user from the list
      setPendingUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id))

      toast({
        title: "User Approved",
        description: `${user.name} has been approved successfully.`,
      })
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const rejectUser = async (user: PendingUser) => {
    try {
      // Update user status to Rejected
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Inactive" }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject user")
      }

      // Remove user from the list
      setPendingUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id))

      toast({
        title: "User Rejected",
        description: `${user.name} has been rejected.`,
      })
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // If session is loading or user is not authenticated, show loading state
  if (sessionStatus === "loading" || !session) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading pending users...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending User Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve new user registrations</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Pending ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="documents">Document Verification</TabsTrigger>
          <TabsTrigger value="identity">Identity Verification</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* User Cards */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserApprovalCard
              key={user.id}
              user={user}
              onViewDetails={() => viewUserDetails(user)}
              onApprove={() => approveUser(user)}
              onReject={() => rejectUser(user)}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending users found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">There are no users pending approval at this time.</p>
            </div>
          </Card>
        )}
      </div>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>User Approval Details</DialogTitle>
              <DialogDescription>Review user information and documents before approval</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">User Information</h3>
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{selectedUser.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedUser.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          +1 (555) 123-4567
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Application Date</p>
                        <p className="text-sm text-gray-500">{selectedUser.date}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Company Information</h3>
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{selectedUser.company}</p>
                        <p className="text-sm text-gray-500">LLC</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Business Address</p>
                        <p className="text-sm text-gray-500">
                          123 Business Ave, Suite 100
                          <br />
                          San Francisco, CA 94107
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Business Information</h3>
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Business Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ein">EIN Number</Label>
                      <Input
                        id="ein"
                        name="ein"
                        value={formData.ein}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Business Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Business Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Business Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="formationDate">Formation Date</Label>
                      <Input
                        id="formationDate"
                        name="formationDate"
                        type="date"
                        value={formData.formationDate}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessId">Business ID (Auto-generated)</Label>
                      <Input
                        id="businessId"
                        name="businessId"
                        value={formData.businessId}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="llcProgress">LLC Progress ({formData.llcProgress}%)</Label>
                    <div className="mt-2">
                      <Input
                        id="llcProgress"
                        name="llcProgress"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.llcProgress}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, llcProgress: Number.parseInt(e.target.value) }))
                        }
                        className={`${formData.llcProgress >= 70 ? "bg-green-100" : "bg-gray-100"}`}
                      />
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${formData.llcProgress >= 70 ? "bg-green-500" : "bg-blue-500"} rounded-full`}
                        style={{ width: `${formData.llcProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Document Verification</h3>
                <Card>
                  <div className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-sm">Document</th>
                          <th className="text-left p-3 font-medium text-sm">Status</th>
                          <th className="text-left p-3 font-medium text-sm">Uploaded</th>
                          <th className="text-left p-3 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.documents.map((doc, index) => (
                          <tr key={index} className={index < selectedUser.documents.length - 1 ? "border-b" : ""}>
                            <td className="p-3">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{doc.name}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center">
                                {doc.status === "Verified" ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-green-600 dark:text-green-400 text-sm">Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 text-amber-500 mr-1" />
                                    <span className="text-amber-600 dark:text-amber-400 text-sm">Pending</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-500">{selectedUser.date}</td>
                            <td className="p-3">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Verify
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Assessment</h3>
                  <Card className="p-4">
                    <div className="flex items-center mb-3">
                      {selectedUser.riskLevel === "Low" ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Shield className="h-5 w-5 mr-2" />
                          <span className="font-medium">Low Risk</span>
                        </div>
                      ) : selectedUser.riskLevel === "Medium" ? (
                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span className="font-medium">Medium Risk</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span className="font-medium">High Risk</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedUser.riskLevel === "Low"
                        ? "All verification checks passed. No risk factors identified."
                        : selectedUser.riskLevel === "Medium"
                          ? "Some verification checks pending. Minor risk factors identified."
                          : "Multiple verification checks pending. Significant risk factors identified."}
                    </p>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <Card className="p-4">
                    <p className="text-sm text-gray-500">{selectedUser.notes}</p>
                  </Card>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => {
                  rejectUser(selectedUser)
                  setShowUserDialog(false)
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleSaveUser}>Save Changes</Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleSaveUser()
                  approveUser(selectedUser)
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function UserApprovalCard({
  user,
  onViewDetails,
  onApprove,
  onReject,
}: {
  user: PendingUser
  onViewDetails: () => void
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center mb-1">
            <p className="font-medium">{user.name}</p>
            {user.riskLevel === "High" && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                High Risk
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500">Business: {user.company}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-xs text-gray-500">Applied: {user.date}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={onReject}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onApprove}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-3">
          {user.documents.map((doc, index) => (
            <div
              key={index}
              className={`flex items-center px-3 py-1 rounded-full text-xs ${
                doc.status === "Verified"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {doc.status === "Verified" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {doc.name}: {doc.status}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

