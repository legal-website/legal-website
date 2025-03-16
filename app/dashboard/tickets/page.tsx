"use client"

import { useState, useEffect } from "react"
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
  Paperclip,
  MoreVertical,
  User,
  Tag,
  RefreshCw,
  TicketIcon,
  FileText,
  Send,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import {
  createTicket,
  getUserTickets,
  getTicketDetails,
  createMessage,
  deleteTicket,
} from "@/lib/actions/ticket-actions"
import type { Ticket, TicketPriority, TicketStatus } from "@/types/ticket"

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium" as TicketPriority,
  })

  // Fetch tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true)
      const result = await getUserTickets()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else if (result.tickets) {
        setTickets(result.tickets as Ticket[])
      }

      setIsLoading(false)
    }

    fetchTickets()
  }, [])

  // Fetch ticket details when a ticket is selected
  useEffect(() => {
    if (selectedTicket?.id) {
      const fetchTicketDetails = async () => {
        const result = await getTicketDetails(selectedTicket.id)

        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        } else if (result.ticket) {
          setSelectedTicket(result.ticket as Ticket)
        }
      }

      fetchTicketDetails()
    }
  }, [selectedTicket?.id])

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
  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !newTicket.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createTicket(newTicket)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Ticket created successfully",
      })

      // Refresh tickets
      const ticketsResult = await getUserTickets()
      if (ticketsResult.tickets) {
        setTickets(ticketsResult.tickets as Ticket[])
      }

      // Reset form
      setNewTicket({
        subject: "",
        description: "",
        category: "",
        priority: "medium",
      })

      setIsCreateDialogOpen(false)
    }

    setIsSubmitting(false)
  }

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    setIsSubmitting(true)

    const result = await createMessage({ content: newMessage, ticketId: selectedTicket.id }, selectedFiles)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      // Refresh ticket details
      const ticketResult = await getTicketDetails(selectedTicket.id)
      if (ticketResult.ticket) {
        setSelectedTicket(ticketResult.ticket as Ticket)
      }

      // Reset form
      setNewMessage("")
      setSelectedFiles([])
    }

    setIsSubmitting(false)
  }

  // Handle deleting a ticket
  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return

    setIsSubmitting(true)

    const result = await deleteTicket(ticketToDelete)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      })

      // Refresh tickets
      const ticketsResult = await getUserTickets()
      if (ticketsResult.tickets) {
        setTickets(ticketsResult.tickets as Ticket[])
      }

      // Reset selected ticket if it was deleted
      if (selectedTicket && selectedTicket.id === ticketToDelete) {
        setSelectedTicket(null)
      }

      setIsDeleteDialogOpen(false)
      setTicketToDelete(null)
    }

    setIsSubmitting(false)
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
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
  const getStatusBadge = (status: TicketStatus) => {
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
  const getPriorityBadge = (priority: TicketPriority) => {
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
    <div className="p-6 max-w-[1600px] mx-auto mb-36">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your support requests and track their status</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={async () => {
              setIsLoading(true)
              const result = await getUserTickets()
              if (result.tickets) {
                setTickets(result.tickets as Ticket[])
              }
              setIsLoading(false)
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-[#22c984] hover:bg-[#0f442e]" onClick={() => setIsCreateDialogOpen(true)}>
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
                    {isLoading ? (
                      <div className="p-6 text-center">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-3" />
                        <p className="text-gray-500">Loading tickets...</p>
                      </div>
                    ) : filteredTickets.length === 0 ? (
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
                                <div className="flex-shrink-0">{getStatusBadge(ticket.status as TicketStatus)}</div>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-500 dark:text-gray-400">
                                  {ticket.id.substring(0, 8)} • {formatDate(ticket.createdAt).split(",")[0]}
                                </div>
                                <div>{getPriorityBadge(ticket.priority as TicketPriority)}</div>
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
                    {getStatusBadge(selectedTicket.status as TicketStatus)}
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
                    {selectedTicket.messages &&
                      selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === selectedTicket.creatorId ? "justify-end" : ""}`}
                        >
                          <div
                            className={`max-w-[80%] ${
                              message.sender === selectedTicket.creatorId
                                ? "bg-purple-50 dark:bg-purple-900/20 rounded-tl-lg rounded-bl-lg rounded-br-lg"
                                : message.sender === "system"
                                  ? "bg-gray-100 dark:bg-gray-800 rounded-lg text-center mx-auto"
                                  : "bg-gray-100 dark:bg-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                            } p-4`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="font-medium">{message.senderName}</span>
                                <span
                                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    message.sender === selectedTicket.creatorId
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                      : message.sender === "system"
                                        ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  {message.sender === selectedTicket.creatorId
                                    ? "You"
                                    : message.sender === "system"
                                      ? "System"
                                      : "Support"}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(message.createdAt).split(", ")[1]}
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.attachments && message.attachments.length > 0 && (
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
                                      <Button variant="ghost" size="sm" asChild>
                                        <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                                          Download
                                        </a>
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
                  <FileUpload onFilesSelected={setSelectedFiles} maxFiles={5} maxSizeMB={10} />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSubmitting}
                      className="bg-[#22c984] hover:bg-[#0f442e]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
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
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicket.subject || !newTicket.description || !newTicket.category || isSubmitting}
              className="bg-[#22c984] hover:bg-[#0f442e]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
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
            <Button variant="destructive" onClick={handleDeleteTicket} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

