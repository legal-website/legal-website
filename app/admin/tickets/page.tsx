"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  ChevronRight,
  MoreHorizontal,
  Send,
  Paperclip,
  Tag,
  Plus,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

// Define types for messages and tickets
interface TicketMessage {
  id: number
  sender: string
  senderType: "customer" | "agent" | "system"
  message: string
  timestamp: string
}

interface Ticket {
  id: string
  subject: string
  customer: string
  company: string
  email: string
  status: "Open" | "In Progress" | "Resolved"
  priority: "High" | "Medium" | "Low"
  category: string
  createdAt: string
  lastUpdated: string
  assignedTo: string
  messages: TicketMessage[]
}

interface NewTicketForm {
  subject: string
  customer: string
  company: string
  email: string
  priority: string
  category: string
  message: string
}

interface TicketsTableProps {
  tickets: Ticket[]
  onViewTicket: (ticket: Ticket) => void
}

export default function SupportTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false)

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("anyone")

  // New ticket form state
  const [newTicket, setNewTicket] = useState<NewTicketForm>({
    subject: "",
    customer: "",
    company: "",
    email: "",
    priority: "Medium",
    category: "Technical",
    message: "",
  })

  const tickets: Ticket[] = [
    {
      id: "TKT-2025-001",
      subject: "Unable to upload documents",
      customer: "John Smith",
      company: "Rapid Ventures LLC",
      email: "john@rapidventures.com",
      status: "Open",
      priority: "High",
      category: "Technical",
      createdAt: "Mar 7, 2025 - 10:23 AM",
      lastUpdated: "Mar 7, 2025 - 11:45 AM",
      assignedTo: "Sarah Johnson",
      messages: [
        {
          id: 1,
          sender: "John Smith",
          senderType: "customer",
          message:
            "I'm trying to upload my Articles of Organization document but keep getting an error message saying 'File upload failed'. I've tried multiple times with different file formats (PDF, DOCX) but nothing works. Can you please help?",
          timestamp: "Mar 7, 2025 - 10:23 AM",
        },
        {
          id: 2,
          sender: "Sarah Johnson",
          senderType: "agent",
          message:
            "Hi John, I'm sorry you're experiencing issues with document uploads. Could you please tell me what browser you're using and if you're getting any specific error code? Also, what is the file size of the document you're trying to upload?",
          timestamp: "Mar 7, 2025 - 10:45 AM",
        },
        {
          id: 3,
          sender: "John Smith",
          senderType: "customer",
          message:
            "I'm using Chrome version 120.0.6099.130 on Windows 10. The file size is about 3.5MB and I don't see any specific error code, just the message 'File upload failed' after the progress bar reaches about 80%.",
          timestamp: "Mar 7, 2025 - 11:02 AM",
        },
        {
          id: 4,
          sender: "Sarah Johnson",
          senderType: "agent",
          message:
            "Thank you for that information. I've checked our system logs and it appears there might be an issue with our document processing service. Our technical team has been notified and is working on a fix. In the meantime, could you try emailing the document to support@example.com with your account details? We'll manually upload it for you.",
          timestamp: "Mar 7, 2025 - 11:45 AM",
        },
      ],
    },
    {
      id: "TKT-2025-002",
      subject: "Question about annual report filing",
      customer: "Emily Chen",
      company: "Blue Ocean Inc",
      email: "emily@blueocean.com",
      status: "Open",
      priority: "Medium",
      category: "Compliance",
      createdAt: "Mar 6, 2025 - 3:15 PM",
      lastUpdated: "Mar 7, 2025 - 9:30 AM",
      assignedTo: "Michael Brown",
      messages: [
        {
          id: 1,
          sender: "Emily Chen",
          senderType: "customer",
          message:
            "I received a notification that my annual report is due soon, but I'm not sure what information I need to prepare. Is there a checklist or guide available?",
          timestamp: "Mar 6, 2025 - 3:15 PM",
        },
        {
          id: 2,
          sender: "Michael Brown",
          senderType: "agent",
          message:
            "Hello Emily, thank you for reaching out. Yes, we do have a comprehensive guide for annual report preparation. I'll send you our Annual Report Checklist PDF which outlines all the information you'll need to gather. Is there a specific state you're filing in? The requirements can vary by state.",
          timestamp: "Mar 6, 2025 - 4:22 PM",
        },
        {
          id: 3,
          sender: "Emily Chen",
          senderType: "customer",
          message: "We're registered in California. Thanks for the quick response!",
          timestamp: "Mar 6, 2025 - 5:01 PM",
        },
        {
          id: 4,
          sender: "Michael Brown",
          senderType: "agent",
          message:
            "Perfect, I've attached our California-specific Annual Report Guide. For California, you'll need to file a Statement of Information (Form SI-550) which requires current business address, officer information, and registered agent details. Our system can pre-fill most of this information for you. Would you like me to initiate the  Our system can pre-fill most of this information for you. Would you like me to initiate the filing process for you now?",
          timestamp: "Mar 7, 2025 - 9:30 AM",
        },
      ],
    },
    {
      id: "TKT-2025-003",
      subject: "Billing discrepancy on invoice",
      customer: "Robert Johnson",
      company: "Summit Solutions",
      email: "robert@summitsolutions.com",
      status: "In Progress",
      priority: "High",
      category: "Billing",
      createdAt: "Mar 5, 2025 - 11:30 AM",
      lastUpdated: "Mar 7, 2025 - 2:15 PM",
      assignedTo: "Jessica Williams",
      messages: [
        {
          id: 1,
          sender: "Robert Johnson",
          senderType: "customer",
          message:
            "I was reviewing my recent invoice (INV-2025-003) and noticed I was charged for 'Expedited Processing' which I don't believe I requested. Can you please review this and make the necessary adjustments?",
          timestamp: "Mar 5, 2025 - 11:30 AM",
        },
        {
          id: 2,
          sender: "Jessica Williams",
          senderType: "agent",
          message:
            "Hi Robert, I apologize for the confusion. I'll look into this right away and get back to you shortly.",
          timestamp: "Mar 5, 2025 - 1:45 PM",
        },
        {
          id: 3,
          sender: "Jessica Williams",
          senderType: "agent",
          message:
            "I've reviewed your account and you're absolutely right. The 'Expedited Processing' charge of $50 was added in error. I've processed a refund for this amount, which should appear on your account within 3-5 business days. I've also attached a corrected invoice for your records. Please let me know if you have any other questions.",
          timestamp: "Mar 6, 2025 - 10:20 AM",
        },
        {
          id: 4,
          sender: "Robert Johnson",
          senderType: "customer",
          message: "Thank you for resolving this so quickly. I appreciate the prompt attention to this matter.",
          timestamp: "Mar 6, 2025 - 11:05 AM",
        },
        {
          id: 5,
          sender: "Jessica Williams",
          senderType: "agent",
          message:
            "You're welcome, Robert. I've also added a note to your account to prevent this from happening again. Is there anything else I can assist you with today?",
          timestamp: "Mar 7, 2025 - 2:15 PM",
        },
      ],
    },
    {
      id: "TKT-2025-004",
      subject: "Need help with business license application",
      customer: "David Lee",
      company: "Horizon Group",
      email: "david@horizongroup.com",
      status: "Open",
      priority: "Medium",
      category: "Licensing",
      createdAt: "Mar 7, 2025 - 9:45 AM",
      lastUpdated: "Mar 7, 2025 - 10:30 AM",
      assignedTo: "Unassigned",
      messages: [
        {
          id: 1,
          sender: "David Lee",
          senderType: "customer",
          message:
            "I'm trying to complete my business license application for a retail store in Atlanta, GA, but I'm unsure about some of the zoning requirements. Can someone help me understand what I need to provide?",
          timestamp: "Mar 7, 2025 - 9:45 AM",
        },
        {
          id: 2,
          sender: "System",
          senderType: "system",
          message: "Your ticket has been received. A support agent will be assigned to your case shortly.",
          timestamp: "Mar 7, 2025 - 9:45 AM",
        },
      ],
    },
    {
      id: "TKT-2025-005",
      subject: "Change of registered agent address",
      customer: "Lisa Wong",
      company: "Quantum Solutions",
      email: "lisa@quantumsolutions.com",
      status: "Resolved",
      priority: "Low",
      category: "Administrative",
      createdAt: "Mar 4, 2025 - 2:30 PM",
      lastUpdated: "Mar 6, 2025 - 4:15 PM",
      assignedTo: "Thomas Garcia",
      messages: [
        {
          id: 1,
          sender: "Lisa Wong",
          senderType: "customer",
          message:
            "We've recently moved our office and need to update our registered agent address. What's the process for doing this?",
          timestamp: "Mar 4, 2025 - 2:30 PM",
        },
        {
          id: 2,
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "Hello Lisa, thank you for notifying us about your address change. To update your registered agent address, we'll need to file an amendment with the Secretary of State. I can help you prepare this filing. Could you please provide your new address details?",
          timestamp: "Mar 4, 2025 - 3:45 PM",
        },
        {
          id: 3,
          sender: "Lisa Wong",
          senderType: "customer",
          message: "Our new address is 123 Tech Parkway, Suite 500, San Jose, CA 95110.",
          timestamp: "Mar 5, 2025 - 10:15 AM",
        },
        {
          id: 4,
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "Thank you for providing the new address. I've prepared the necessary amendment forms for California. I've attached them for your review. Once you approve, I'll submit them to the Secretary of State on your behalf. There will be a state filing fee of $30 which will be charged to your account.",
          timestamp: "Mar 5, 2025 - 11:30 AM",
        },
        {
          id: 5,
          sender: "Lisa Wong",
          senderType: "customer",
          message: "The forms look good. Please proceed with the filing.",
          timestamp: "Mar 5, 2025 - 1:45 PM",
        },
        {
          id: 6,
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "I've submitted the address change amendment to the California Secretary of State. You should receive confirmation within 5-7 business days. I'll update you once we receive the filed documents. Is there anything else you need assistance with?",
          timestamp: "Mar 5, 2025 - 3:20 PM",
        },
        {
          id: 7,
          sender: "Lisa Wong",
          senderType: "customer",
          message: "No, that's all for now. Thank you for your help!",
          timestamp: "Mar 5, 2025 - 4:05 PM",
        },
        {
          id: 8,
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "Good news! We've received confirmation from the California Secretary of State that your registered agent address change has been processed and is now effective. I've attached the filed documents for your records. Your account has been updated with the new address.",
          timestamp: "Mar 6, 2025 - 4:15 PM",
        },
      ],
    },
  ]

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.company.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "open" && ticket.status === "Open") ||
      (activeTab === "inprogress" && ticket.status === "In Progress") ||
      (activeTab === "resolved" && ticket.status === "Resolved") ||
      activeTab === "all"

    const matchesPriority = priorityFilter === "all" || ticket.priority.toLowerCase() === priorityFilter.toLowerCase()

    const matchesCategory = categoryFilter === "all" || ticket.category.toLowerCase() === categoryFilter.toLowerCase()

    const matchesAssignee =
      assigneeFilter === "anyone" ||
      (assigneeFilter === "unassigned" && ticket.assignedTo === "Unassigned") ||
      (assigneeFilter === "me" && ticket.assignedTo === "Sarah Johnson") || // Assuming current user is Sarah Johnson
      ticket.assignedTo === assigneeFilter

    return matchesSearch && matchesTab && matchesPriority && matchesCategory && matchesAssignee
  })

  const viewTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowTicketDialog(true)
  }

  const handleCreateTicket = () => {
    setShowCreateTicketDialog(true)
  }

  const handleSubmitNewTicket = () => {
    // Here you would normally send this to your API
    toast({
      title: "Ticket created",
      description: `Ticket for ${newTicket.customer} has been created successfully.`,
    })

    setShowCreateTicketDialog(false)
    // Reset form
    setNewTicket({
      subject: "",
      customer: "",
      company: "",
      email: "",
      priority: "Medium",
      category: "Technical",
      message: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTicket((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewTicket((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and respond to customer support requests</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateTicket}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tickets..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <select
            className="flex-1 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="flex-1 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="compliance">Compliance</option>
            <option value="licensing">Licensing</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500">Assigned to:</span>
          <select
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="anyone">Anyone</option>
            <option value="me">Me</option>
            <option value="unassigned">Unassigned</option>
            <option value="Sarah Johnson">Sarah Johnson</option>
            <option value="Michael Brown">Michael Brown</option>
            <option value="Jessica Williams">Jessica Williams</option>
            <option value="Thomas Garcia">Thomas Garcia</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TicketsTable tickets={filteredTickets} onViewTicket={viewTicketDetails} />
        </TabsContent>

        <TabsContent value="open">
          <TicketsTable tickets={filteredTickets} onViewTicket={viewTicketDetails} />
        </TabsContent>

        <TabsContent value="inprogress">
          <TicketsTable tickets={filteredTickets} onViewTicket={viewTicketDetails} />
        </TabsContent>

        <TabsContent value="resolved">
          <TicketsTable tickets={filteredTickets} onViewTicket={viewTicketDetails} />
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Ticket ID</h3>
                  <p className="font-mono">{selectedTicket.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <TicketStatusBadge status={selectedTicket.status} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  <TicketPriorityBadge priority={selectedTicket.priority} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p>{selectedTicket.customer}</p>
                  <p className="text-sm text-gray-500">{selectedTicket.company}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    {selectedTicket.category}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                  <p>{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <p className="text-sm">{selectedTicket.createdAt}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-sm">{selectedTicket.lastUpdated}</p>
                </div>
              </div>

              {/* Ticket Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="outline" size="sm">
                  Assign
                </Button>
                <Button variant="outline" size="sm">
                  Change Status
                </Button>
                <Button variant="outline" size="sm">
                  Change Priority
                </Button>
                <Button variant="outline" size="sm" className="ml-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Conversation */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium">Conversation</h3>

                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.senderType === "customer"
                        ? "bg-blue-50 dark:bg-blue-900/20 ml-0 mr-12"
                        : message.senderType === "agent"
                          ? "bg-gray-50 dark:bg-gray-800 ml-12 mr-0"
                          : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Avatar className="h-8 w-8 mr-2">
                        {message.senderType === "customer" ? (
                          <User className="h-4 w-4" />
                        ) : message.senderType === "agent" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{message.sender}</p>
                        <p className="text-xs text-gray-500">{message.timestamp}</p>
                      </div>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== "Resolved" && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Reply</h3>
                  <Textarea placeholder="Type your reply here..." className="min-h-[100px] mb-2" />
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Save as Draft
                      </Button>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of the issue"
                className="col-span-3"
                value={newTicket.subject}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Customer Name
              </Label>
              <Input
                id="customer"
                name="customer"
                placeholder="Full name"
                className="col-span-3"
                value={newTicket.customer}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                placeholder="Company name"
                className="col-span-3"
                value={newTicket.company}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="customer@example.com"
                className="col-span-3"
                value={newTicket.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={newTicket.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={newTicket.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Licensing">Licensing</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Detailed description of the issue"
                className="col-span-3 min-h-[100px]"
                value={newTicket.message}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicketDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSubmitNewTicket}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Extracted TicketsTable component for better organization
function TicketsTable({ tickets, onViewTicket }: TicketsTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-sm">ID</th>
              <th className="text-left p-4 font-medium text-sm">Subject</th>
              <th className="text-left p-4 font-medium text-sm">Customer</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Priority</th>
              <th className="text-left p-4 font-medium text-sm">Category</th>
              <th className="text-left p-4 font-medium text-sm">Last Updated</th>
              <th className="text-left p-4 font-medium text-sm">Assigned To</th>
              <th className="text-left p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => onViewTicket(ticket)}
                >
                  <td className="p-4">
                    <span className="font-mono text-sm">{ticket.id}</span>
                  </td>
                  <td className="p-4 font-medium">{ticket.subject}</td>
                  <td className="p-4">
                    <div>
                      <p>{ticket.customer}</p>
                      <p className="text-sm text-gray-500">{ticket.company}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td className="p-4">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                      <Tag className="h-3 w-3 mr-1" />
                      {ticket.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{ticket.lastUpdated}</td>
                  <td className="p-4">
                    {ticket.assignedTo === "Unassigned" ? (
                      <span className="text-gray-500">Unassigned</span>
                    ) : (
                      ticket.assignedTo
                    )}
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No tickets found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function TicketStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Open":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <MessageSquare className="h-3 w-3 mr-1" />
          Open
        </span>
      )
    case "In Progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </span>
      )
    case "Resolved":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Resolved
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      )
  }
}

function TicketPriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "High":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          High
        </span>
      )
    case "Medium":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Medium
        </span>
      )
    case "Low":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Low
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {priority}
        </span>
      )
  }
}

