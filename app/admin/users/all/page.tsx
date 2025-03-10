"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Building,
  Calendar,
  Shield,
  User,
  FileText,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

// Define types for our data
interface UserDocument {
  name: string
  status: "Verified" | "Pending" | "Rejected"
  date: string
}

interface UserActivity {
  action: string
  date: string
  details: string
}

interface UserData {
  id: number
  name: string
  email: string
  company: string
  role: string
  status: "Active" | "Pending" | "Inactive" | "Suspended"
  joinDate: string
  lastActive: string
  documents: UserDocument[]
  activity: UserActivity[]
  profileImage?: string
  phone: string
  address: string
  subscriptionPlan: string
  subscriptionStatus: "Active" | "Expired" | "Trial"
  notes?: string
}

export default function AllUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRole, setSelectedRole] = useState("All Roles")

  // Sample user data
  const users: UserData[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@rapidventures.com",
      company: "Rapid Ventures LLC",
      role: "Client Admin",
      status: "Active",
      joinDate: "Jan 15, 2023",
      lastActive: "Today at 10:23 AM",
      phone: "(555) 123-4567",
      address: "123 Business Ave, San Francisco, CA 94107",
      subscriptionPlan: "Business Pro",
      subscriptionStatus: "Active",
      documents: [
        { name: "Articles of Organization", status: "Verified", date: "Jan 15, 2023" },
        { name: "Operating Agreement", status: "Verified", date: "Jan 15, 2023" },
        { name: "EIN Confirmation", status: "Verified", date: "Jan 20, 2023" },
      ],
      activity: [
        { action: "Login", date: "Today at 10:23 AM", details: "Logged in from San Francisco, CA" },
        { action: "Document Upload", date: "Yesterday at 3:45 PM", details: "Uploaded Annual Report 2024" },
        { action: "Profile Update", date: "Mar 5, 2025", details: "Updated company address" },
      ],
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael@blueocean.com",
      company: "Blue Ocean Inc",
      role: "Client User",
      status: "Active",
      joinDate: "Feb 10, 2023",
      lastActive: "Yesterday at 4:15 PM",
      phone: "(555) 987-6543",
      address: "456 Tech Blvd, Seattle, WA 98101",
      subscriptionPlan: "Business Standard",
      subscriptionStatus: "Active",
      documents: [
        { name: "Articles of Organization", status: "Verified", date: "Feb 10, 2023" },
        { name: "Operating Agreement", status: "Verified", date: "Feb 10, 2023" },
        { name: "Tax Filing Q1", status: "Pending", date: "Mar 5, 2025" },
      ],
      activity: [
        { action: "Login", date: "Yesterday at 4:15 PM", details: "Logged in from Seattle, WA" },
        { action: "Document Download", date: "Mar 6, 2025", details: "Downloaded Tax Filing Template" },
        { action: "Support Request", date: "Mar 3, 2025", details: "Opened ticket #45678" },
      ],
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily@summitsolutions.com",
      company: "Summit Solutions",
      role: "Client Admin",
      status: "Active",
      joinDate: "Mar 5, 2023",
      lastActive: "Mar 7, 2025 at 9:30 AM",
      phone: "(555) 456-7890",
      address: "789 Summit Ave, Denver, CO 80202",
      subscriptionPlan: "Business Pro",
      subscriptionStatus: "Active",
      documents: [
        { name: "Articles of Organization", status: "Verified", date: "Mar 5, 2023" },
        { name: "Operating Agreement", status: "Verified", date: "Mar 5, 2023" },
        { name: "Business License", status: "Verified", date: "Mar 10, 2023" },
      ],
      activity: [
        { action: "Login", date: "Mar 7, 2025 at 9:30 AM", details: "Logged in from Denver, CO" },
        { action: "Payment", date: "Mar 1, 2025", details: "Processed subscription renewal" },
        { action: "User Invite", date: "Feb 25, 2025", details: "Invited team member john@summitsolutions.com" },
      ],
    },
    {
      id: 4,
      name: "David Kim",
      email: "david@horizongroup.com",
      company: "Horizon Group",
      role: "Client User",
      status: "Inactive",
      joinDate: "Apr 20, 2023",
      lastActive: "Feb 15, 2025 at 2:45 PM",
      phone: "(555) 789-0123",
      address: "101 Horizon St, Austin, TX 78701",
      subscriptionPlan: "Business Standard",
      subscriptionStatus: "Expired",
      documents: [
        { name: "Articles of Organization", status: "Verified", date: "Apr 20, 2023" },
        { name: "Operating Agreement", status: "Verified", date: "Apr 20, 2023" },
      ],
      activity: [
        { action: "Login", date: "Feb 15, 2025 at 2:45 PM", details: "Logged in from Austin, TX" },
        { action: "Subscription", date: "Feb 15, 2025", details: "Subscription expired" },
        { action: "Document Access", date: "Feb 10, 2025", details: "Accessed Operating Agreement" },
      ],
    },
    {
      id: 5,
      name: "Alex Thompson",
      email: "alex@nexustech.com",
      company: "Nexus Technologies",
      role: "Client Admin",
      status: "Pending",
      joinDate: "Mar 7, 2025",
      lastActive: "Mar 7, 2025 at 11:20 AM",
      phone: "(555) 234-5678",
      address: "222 Tech Park, Boston, MA 02110",
      subscriptionPlan: "Business Pro",
      subscriptionStatus: "Trial",
      documents: [
        { name: "ID Verification", status: "Verified", date: "Mar 7, 2025" },
        { name: "Business License", status: "Pending", date: "Mar 7, 2025" },
        { name: "Tax ID", status: "Verified", date: "Mar 7, 2025" },
      ],
      activity: [
        { action: "Account Creation", date: "Mar 7, 2025 at 11:00 AM", details: "Account created" },
        { action: "Document Upload", date: "Mar 7, 2025 at 11:15 AM", details: "Uploaded verification documents" },
        { action: "Login", date: "Mar 7, 2025 at 11:20 AM", details: "First login from Boston, MA" },
      ],
    },
    {
      id: 6,
      name: "Maria Garcia",
      email: "maria@stellarinnovations.com",
      company: "Stellar Innovations",
      role: "Super Admin",
      status: "Active",
      joinDate: "Jan 5, 2023",
      lastActive: "Today at 9:45 AM",
      phone: "(555) 345-6789",
      address: "333 Innovation Way, Chicago, IL 60601",
      subscriptionPlan: "Enterprise",
      subscriptionStatus: "Active",
      documents: [
        { name: "ID Verification", status: "Verified", date: "Jan 5, 2023" },
        { name: "Employment Contract", status: "Verified", date: "Jan 5, 2023" },
      ],
      activity: [
        { action: "Login", date: "Today at 9:45 AM", details: "Logged in from Chicago, IL" },
        { action: "User Management", date: "Today at 10:15 AM", details: "Approved new user account" },
        { action: "System Settings", date: "Yesterday at 2:30 PM", details: "Updated system configuration" },
      ],
    },
    {
      id: 7,
      name: "James Wilson",
      email: "james@pinnaclegroup.com",
      company: "Pinnacle Group",
      role: "Support Agent",
      status: "Active",
      joinDate: "Feb 15, 2023",
      lastActive: "Today at 11:30 AM",
      phone: "(555) 456-7890",
      address: "444 Support Ave, Miami, FL 33101",
      subscriptionPlan: "Internal",
      subscriptionStatus: "Active",
      documents: [
        { name: "ID Verification", status: "Verified", date: "Feb 15, 2023" },
        { name: "Employment Contract", status: "Verified", date: "Feb 15, 2023" },
      ],
      activity: [
        { action: "Login", date: "Today at 11:30 AM", details: "Logged in from Miami, FL" },
        { action: "Ticket Response", date: "Today at 11:45 AM", details: "Responded to ticket #45678" },
        { action: "Document Review", date: "Yesterday at 3:15 PM", details: "Reviewed client documents" },
      ],
    },
  ]

  // Filter users based on search query, tab, and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && user.status === "Active") ||
      (activeTab === "pending" && user.status === "Pending") ||
      (activeTab === "inactive" && (user.status === "Inactive" || user.status === "Suspended")) ||
      activeTab === "all"

    const matchesRole = selectedRole === "All Roles" || user.role === selectedRole

    return matchesSearch && matchesTab && matchesRole
  })

  const viewUserDetails = (user: UserData) => {
    setSelectedUser(user)
    setShowUserDialog(true)
  }

  const roles = ["All Roles", "Super Admin", "Admin", "Support Agent", "Client Admin", "Client User"]

  // Function to export user data as CSV
  const exportUserData = () => {
    // Define the headers for the CSV file
    const headers = [
      "ID",
      "Name",
      "Email",
      "Company",
      "Role",
      "Status",
      "Join Date",
      "Last Active",
      "Phone",
      "Address",
      "Subscription Plan",
      "Subscription Status",
    ]

    // Convert user data to CSV format
    const userDataCSV = filteredUsers.map((user) => [
      user.id,
      user.name,
      user.email,
      user.company,
      user.role,
      user.status,
      user.joinDate,
      user.lastActive,
      user.phone,
      user.address,
      user.subscriptionPlan,
      user.subscriptionStatus,
    ])

    // Combine headers and data
    const csvContent = [headers.join(","), ...userDataCSV.map((row) => row.join(","))].join("\n")

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link and trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `user-data-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all users in the system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={exportUserData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddUserDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserTable users={filteredUsers} onViewUser={viewUserDetails} />
        </TabsContent>

        <TabsContent value="active">
          <UserTable users={filteredUsers} onViewUser={viewUserDetails} />
        </TabsContent>

        <TabsContent value="pending">
          <UserTable users={filteredUsers} onViewUser={viewUserDetails} />
        </TabsContent>

        <TabsContent value="inactive">
          <UserTable users={filteredUsers} onViewUser={viewUserDetails} />
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Detailed information about {selectedUser.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* User Profile */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                        {selectedUser.profileImage ? (
                          <Image
                            src={selectedUser.profileImage || "/placeholder.svg"}
                            alt={selectedUser.name}
                            width={96}
                            height={96}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-3xl text-gray-600 dark:text-gray-300 font-medium">
                            {selectedUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{selectedUser.email}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          selectedUser.role === "Super Admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : selectedUser.role === "Admin" || selectedUser.role === "Client Admin"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : selectedUser.role === "Support Agent"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {selectedUser.role}
                      </span>

                      <div className="mt-6 w-full">
                        <div className="flex items-center text-sm mb-2">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.phone}
                        </div>
                        <div className="flex items-start text-sm mb-2">
                          <Building className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                          <span>{selectedUser.address}</span>
                        </div>
                        <div className="flex items-center text-sm mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Joined {selectedUser.joinDate}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:w-2/3 space-y-6">
                  {/* Subscription Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Subscription</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="font-medium">{selectedUser.subscriptionPlan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                            selectedUser.subscriptionStatus === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : selectedUser.subscriptionStatus === "Trial"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {selectedUser.subscriptionStatus === "Active" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : selectedUser.subscriptionStatus === "Trial" ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {selectedUser.subscriptionStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Next Billing</p>
                        <p className="font-medium">Apr 15, 2025</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-medium">$49.99/month</p>
                      </div>
                    </div>
                  </Card>

                  {/* Security Info */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Two-Factor Authentication</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-medium">Enabled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Last Password Change</span>
                        </div>
                        <span>Feb 15, 2025</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Login Sessions</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Documents and Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documents */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Documents</h3>
                  </div>
                  <div className="p-4">
                    {selectedUser.documents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500">{doc.date}</p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                doc.status === "Verified"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : doc.status === "Pending"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No documents found</p>
                    )}
                  </div>
                </Card>

                {/* Activity */}
                <Card>
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Recent Activity</h3>
                  </div>
                  <div className="p-4">
                    {selectedUser.activity.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.activity.map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                              <Clock className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.action}</p>
                              <p className="text-xs text-gray-500">{activity.date}</p>
                              <p className="text-xs text-gray-500">{activity.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No activity found</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Notes */}
              {selectedUser.notes && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.notes}</p>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Close
              </Button>
              <Button variant="outline">Edit User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First name" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last name" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="Email address" />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Phone number" />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Company name" />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {roles
                  .filter((r) => r !== "All Roles")
                  .map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Additional notes about this user" />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="sendInvite" className="rounded border-gray-300" />
              <Label htmlFor="sendInvite">Send welcome email with login instructions</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// User Table Component
function UserTable({ users, onViewUser }: { users: UserData[]; onViewUser: (user: UserData) => void }) {
  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <User className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No users match your current filters. Try adjusting your search criteria.
          </p>
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
              <th className="text-left p-4 font-medium text-sm">User</th>
              <th className="text-left p-4 font-medium text-sm">Role</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Company</th>
              <th className="text-left p-4 font-medium text-sm">Join Date</th>
              <th className="text-left p-4 font-medium text-sm">Last Active</th>
              <th className="text-left p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage || "/placeholder.svg"}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.role === "Super Admin"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : user.role === "Admin" || user.role === "Client Admin"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : user.role === "Support Agent"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : user.status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.status === "Active" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : user.status === "Pending" ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {user.status}
                  </span>
                </td>
                <td className="p-4">{user.company}</td>
                <td className="p-4">{user.joinDate}</td>
                <td className="p-4">{user.lastActive}</td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewUser(user)}>
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Active" ? (
                          <DropdownMenuItem className="text-amber-600 dark:text-amber-400">
                            Suspend User
                          </DropdownMenuItem>
                        ) : user.status === "Inactive" || user.status === "Suspended" ? (
                          <DropdownMenuItem className="text-green-600 dark:text-green-400">
                            Activate User
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

