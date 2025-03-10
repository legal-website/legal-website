"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, CheckCircle2, XCircle, Eye, Clock, AlertTriangle, Shield, FileText, Mail, Phone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Define interfaces for type safety
interface Document {
  name: string
  status: "Verified" | "Pending"
}

interface PendingUser {
  id: number
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  
  const pendingUsers: PendingUser[] = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex@example.com",
      company: "Nexus Technologies",
      date: "Mar 7, 2025",
      status: "Pending",
      documents: [
        { name: "ID Verification", status: "Verified" },
        { name: "Business License", status: "Pending" },
        { name: "Tax ID", status: "Verified" },
      ],
      notes: "Applicant has submitted all required documents. Business license verification is in progress.",
      riskLevel: "Low",
    },
    {
      id: 2,
      name: "Maria Garcia",
      email: "maria@example.com",
      company: "Stellar Innovations",
      date: "Mar 6, 2025",
      status: "Pending",
      documents: [
        { name: "ID Verification", status: "Verified" },
        { name: "Business License", status: "Verified" },
        { name: "Tax ID", status: "Pending" },
      ],
      notes: "Waiting for tax ID verification. All other documents have been verified.",
      riskLevel: "Medium",
    },
    {
      id: 3,
      name: "James Wilson",
      email: "james@example.com",
      company: "Pinnacle Group",
      date: "Mar 5, 2025",
      status: "Pending",
      documents: [
        { name: "ID Verification", status: "Pending" },
        { name: "Business License", status: "Verified" },
        { name: "Tax ID", status: "Verified" },
      ],
      notes: "ID verification in progress. Applicant has been contacted for additional information.",
      riskLevel: "Medium",
    },
    {
      id: 4,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      company: "Horizon Enterprises",
      date: "Mar 4, 2025",
      status: "Pending",
      documents: [
        { name: "ID Verification", status: "Verified" },
        { name: "Business License", status: "Pending" },
        { name: "Tax ID", status: "Pending" },
      ],
      notes: "Multiple documents pending verification. Applicant has been notified.",
      riskLevel: "High",
    },
    {
      id: 5,
      name: "Michael Chen",
      email: "michael@example.com",
      company: "Quantum Solutions",
      date: "Mar 3, 2025",
      status: "Pending",
      documents: [
        { name: "ID Verification", status: "Verified" },
        { name: "Business License", status: "Verified" },
        { name: "Tax ID", status: "Verified" },
      ],
      notes: "All documents verified. Ready for final approval.",
      riskLevel: "Low",
    },
  ]
  
  const filteredUsers = pendingUsers.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  
  const viewUserDetails = (user: PendingUser) => {
    setSelectedUser(user)
    setShowUserDialog(true)
  }
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending User Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and approve new user registrations
          </p>
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
        {filteredUsers.map((user) => (
          <UserApprovalCard
            key={user.id}
            user={user}
            onViewDetails={() => viewUserDetails(user)}
          />
        ))}
      </div>
      
      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>User Approval Details</DialogTitle>
              <DialogDescription>
                Review user information and documents before approval
              </DialogDescription>
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
                          123 Business Ave, Suite 100<br />
                          San Francisco, CA 94107
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
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
                            <td className="p-3 text-sm text-gray-500">Mar 3, 2025</td>
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
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
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
  onViewDetails 
}: { 
  user: PendingUser; 
  onViewDetails: () => void;
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
            <span className="text-xs text-gray-500">Company: {user.company}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-xs text-gray-500">Applied: {user.date}</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
