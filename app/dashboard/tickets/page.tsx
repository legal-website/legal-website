"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Filter,
  Clock,
  AlertCircle,
  MessageCircle,
  Paperclip,
  MoreVertical,
  User,
  Tag,
  RefreshCw,
  TicketIcon,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define types
interface Ticket {
  id: string
  subject: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  attachments: Attachment[]
}

interface Message {
  id: string
  sender: "client" | "support"
  senderName: string
  content: string
  timestamp: string
  attachments: Attachment[]
}

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  url: string
}

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium",
  })
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)

  // Sample ticket data
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "TKT-2025-001",
      subject: "Need help with business name change",
      description: "I need to update my business name. What documents do I need to submit?",
      status: "open",
      priority: "medium",
      category: "Business Changes",
      createdAt: "2025-03-08T14:30:00Z",
      updatedAt: "2025-03-08T14:30:00Z",
      messages: [
        {
          id: "msg-001",
          sender: "client",
          senderName: "John Smith",
          content: "I need to update my business name. What documents do I need to submit?",
          timestamp: "2025-03-08T14:30:00Z",
          attachments: [],
        },
        {
          id: "msg-002",
          sender: "support",
          senderName: "Sarah Johnson",
          content:
            "Thank you for reaching out. To change your business name, you'll need to submit an amendment to your Articles of Organization. I can help guide you through this process. Could you please provide your current business name and the new name you'd like to use?",
          timestamp: "2025-03-08T15:45:00Z",
          attachments: [
            {
              id: "att-001",
              name: "name_change_guide.pdf",
              size: "1.2 MB",
              type: "application/pdf",
              url: "#",
            },
          ],
        },
        {
          id: "msg-003",
          sender: "client",
          senderName: "John Smith",
          content:
            "My current business name is 'Rapid Ventures LLC' and I'd like to change it to 'Rapid Innovations LLC'. I've attached my current Articles of Organization for reference.",
          timestamp: "2025-03-08T16:30:00Z",
          attachments: [
            {
              id: "att-002",
              name: "current_articles.pdf",
              size: "2.4 MB",
              type: "application/pdf",
              url: "#",
            },
          ],
        },
      ],
      attachments: [
        {
          id: "att-002",
          name: "current_articles.pdf",
          size: "2.4 MB",
          type: "application/pdf",
          url: "#",
        },
      ],
    },
    {
      id: "TKT-2025-002",
      subject: "Annual report filing issue",
      description: "I'm having trouble submitting my annual report through the portal.",
      status: "in-progress",
      priority: "high",
      category: "Compliance",
      createdAt: "2025-03-05T10:15:00Z",
      updatedAt: "2025-03-07T11:20:00Z",
      messages: [
        {
          id: "msg-004",
          sender: "client",
          senderName: "John Smith",
          content:
            "I'm having trouble submitting my annual report through the portal. I keep getting an error message when I try to submit the payment.",
          timestamp: "2025-03-05T10:15:00Z",
          attachments: [
            {
              id: "att-003",
              name: "error_screenshot.png",
              size: "856 KB",
              type: "image/png",
              url: "#",
            },
          ],
        },
        {
          id: "msg-005",
          sender: "support",
          senderName: "Michael Chen",
          content:
            "I'm sorry you're experiencing issues with the annual report submission. I can see from your screenshot that there might be an issue with our payment processor. Let me check this with our technical team and get back to you shortly.",
          timestamp: "2025-03-05T11:30:00Z",
          attachments: [],
        },
        {
          id: "msg-006",
          sender: "support",
          senderName: "Michael Chen",
          content:
            "Our technical team has identified the issue and it should be resolved now. Could you please try submitting your annual report again? If you continue to experience problems, please let me know.",
          timestamp: "2025-03-07T11:20:00Z",
          attachments: [],
        },
      ],
      attachments: [
        {
          id: "att-003",
          name: "error_screenshot.png",
          size: "856 KB",
          type: "image/png",
          url: "#",
        },
      ],
    },
    {
      id: "TKT-2025-003",
      subject: "Tax ID verification",
      description: "Need help verifying my tax ID for a new contract.",
      status: "resolved",
      priority: "medium",
      category: "Tax",
      createdAt: "2025-02-28T09:45:00Z",
      updatedAt: "2025-03-02T14:10:00Z",
      messages: [
        {
          id: "msg-007",
          sender: "client",
          senderName: "John Smith",
          content:
            "I need help verifying my tax ID for a new contract I'm signing. The other party is requesting verification of my EIN.",
          timestamp: "2025-02-28T09:45:00Z",
          attachments: [],
        },
        {
          id: "msg-008",
          sender: "support",
          senderName: "Emily Rodriguez",
          content:
            "I'd be happy to help you with the tax ID verification. We can provide you with an EIN verification letter. To proceed, could you please confirm your business name and EIN for security purposes?",
          timestamp: "2025-02-28T10:30:00Z",
          attachments: [],
        },
        {
          id: "msg-009",
          sender: "client",
          senderName: "John Smith",
          content: "My business name is 'Rapid Ventures LLC' and the EIN is 93-4327510.",
          timestamp: "2025-02-28T11:15:00Z",
          attachments: [],
        },
        {
          id: "msg-010",
          sender: "support",
          senderName: "Emily Rodriguez",
          content:
            "Thank you for confirming. I've generated an EIN verification letter for you. You can download it from the attachment below. Please let me know if you need anything else!",
          timestamp: "2025-03-02T14:10:00Z",
          attachments: [
            {
              id: "att-004",
              name: "ein_verification_letter.pdf",
              size: "1.1 MB",
              type: "application/pdf",
              url: "#",
            },
          ],
        },
      ],
      attachments: [
        {
          id: "att-004",
          name: "ein_verification_letter.pdf",
          size: "1.1 MB",
          type: "application/pdf",
          url: "#",
        },
      ],
    },
  ])

  // Filter tickets based on search query and active tab
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "open") return matchesSearch && ticket.status === "open"
    if (activeTab === "in-progress") return matchesSearch && ticket.status === "in-progress"
    if (activeTab === "resolved") return matchesSearch && (ticket.status === "resolved" || ticket.status === "closed")

    return matchesSearch
  })

  // Handle creating a new ticket
  const handleCreateTicket = () => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "client",
      senderName: "John Smith",
      content: newTicket.description,
      timestamp: new Date().toISOString(),
      attachments: [],
    }

    const newTicketObj: Ticket = {
      id: `TKT-2025-${String(tickets.length + 1).padStart(3, "0")}`,
      subject: newTicket.subject,
      description: newTicket.description,
      status: "open",
      priority: newTicket.priority as "low" | "medium" | "high" | "urgent",
      category: newTicket.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [newMsg],
      attachments: [],
    }

    setTickets([newTicketObj, ...tickets])
    setIsCreateDialogOpen(false)
    setNewTicket({
      subject: "",
      description: "",
      category: "",
      priority: "medium",
    })
  }

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "client",
      senderName: "John Smith",
      content: newMessage,
      timestamp: new Date().toISOString(),
      attachments: [],
    }

    const updatedTicket: Ticket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMsg],
      status:
        selectedTicket.status === "resolved" || selectedTicket.status === "closed" ? "open" : selectedTicket.status,
      updatedAt: new Date().toISOString(),
    }

    setTickets(tickets.map((ticket) => (ticket.id === selectedTicket.id ? updatedTicket : ticket)))
    setSelectedTicket(updatedTicket)
    setNewMessage("")
  }

  // Handle deleting a ticket
  const handleDeleteTicket = () => {
    if (!ticketToDelete) return

    setTickets(tickets.filter((ticket) => ticket.id !== ticketToDelete))
    setIsDeleteDialogOpen(false)
    setTicketToDelete(null)
    if (selectedTicket && selectedTicket.id === ticketToDelete) {
      setSelectedTicket(null)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Open</Badge>
      case "in-progress":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">In Progress</Badge>
        )
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Resolved</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <Badge
            variant="outline"
            className="border-green-200 text-green-800 dark:border-green-800 dark:text-green-400"
          >
            Low
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-400">
            Medium
          </Badge>
        )
      case "high":
        return (
          <Badge
            variant="outline"
            className="border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-400"
          >
            High
          </Badge>
        )
      case "urgent":
        return (
          <Badge variant="outline" className="border-red-200 text-red-800 dark:border-red-800 dark:text-red-400">
            Urgent
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your support requests and track their status</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>My Tickets</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start px-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="m-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredTickets.length === 0 ? (
                      <div className="p-6 text-center">
                        <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="font-medium text-lg mb-1">No tickets found</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {searchQuery ? "Try a different search term" : "Create a new ticket to get started"}
                        </p>
                        {!searchQuery && (
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Ticket
                          </Button>
                        )}
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {filteredTickets.map((ticket) => (
                          <li key={ticket.id}>
                            <button
                              className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                selectedTicket?.id === ticket.id ? "bg-gray-50 dark:bg-gray-800" : ""
                              }`}
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium truncate mr-2">{ticket.subject}</div>
                                <div className="flex-shrink-0">{getStatusBadge(ticket.status)}</div>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-500 dark:text-gray-400">
                                  {ticket.id} • {formatDate(ticket.createdAt).split(",")[0]}
                                </div>
                                <div>{getPriorityBadge(ticket.priority)}</div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedTicket.id} • {formatDate(selectedTicket.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedTicket.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setTicketToDelete(selectedTicket.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          Delete Ticket
                        </DropdownMenuItem>
                        {selectedTicket.status !== "closed" && <DropdownMenuItem>Close Ticket</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-gray-500 mr-1">Category:</span>
                    <span>{selectedTicket.category}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-gray-500 mr-1">Last Updated:</span>
                    <span>{formatDate(selectedTicket.updatedAt)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-gray-500 mr-1">Priority:</span>
                    <span>{selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="border rounded-lg mb-4">
                  <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-medium">Conversation</h3>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto space-y-6">
                    {selectedTicket.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === "client" ? "justify-end" : ""}`}>
                        <div
                          className={`max-w-[80%] ${message.sender === "client" ? "bg-purple-50 dark:bg-purple-900/20 rounded-tl-lg rounded-bl-lg rounded-br-lg" : "bg-gray-100 dark:bg-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg"} p-4`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium">{message.senderName}</span>
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${message.sender === "client" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"}`}
                              >
                                {message.sender === "client" ? "You" : "Support"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(message.timestamp).split(", ")[1]}</div>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <Paperclip className="h-4 w-4 mr-1" />
                                <span>Attachments ({message.attachments.length})</span>
                              </div>
                              <div className="space-y-2">
                                {message.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center p-2 border rounded-md bg-gray-50 dark:bg-gray-800"
                                  >
                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                    <div className="flex-1 min-w-0">
                                      <div className="truncate font-medium text-sm">{attachment.name}</div>
                                      <div className="text-xs text-gray-500">{attachment.size}</div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      Download
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-6 text-center">
              <TicketIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Ticket Selected</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Select a ticket from the list to view its details or create a new ticket to get support.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Ticket
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new support ticket. Our team will respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-subject" className="text-right">
                Subject
              </Label>
              <Input
                id="ticket-subject"
                placeholder="Brief description of your issue"
                className="col-span-3"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-category" className="text-right">
                Category
              </Label>
              <Select
                value={newTicket.category}
                onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
              >
                <SelectTrigger id="ticket-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business Changes">Business Changes</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Tax">Tax</SelectItem>
                  <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-priority" className="text-right">
                Priority
              </Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
              >
                <SelectTrigger id="ticket-priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="ticket-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="ticket-description"
                placeholder="Detailed description of your issue"
                className="col-span-3"
                rows={5}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Attachments</Label>
              <div className="col-span-3">
                <Button variant="outline" type="button" className="w-full">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Attachments
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicket.subject || !newTicket.description || !newTicket.category}
            >
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTicket}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

