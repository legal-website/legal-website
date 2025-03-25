"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  Send,
  Paperclip,
  Tag,
  Loader2,
  AlertCircle,
  TicketIcon,
  FileText,
  Bell,
  Users,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import {
  getAllTickets,
  getSupportUsers,
  getTicketStats,
  getClients,
  getUnreadMessageCounts,
  updateTicketLastViewed,
} from "@/lib/actions/admin-ticket-actions"
import { getTicketDetails, createMessage, updateTicket, deleteTicket } from "@/lib/actions/ticket-actions"
import type { Ticket, TicketStatus, TicketPriority } from "@/types/ticket"
import { useNotifications } from "@/components/admin/header"
import { ticketEvents, getLastSeenTickets, updateLastSeenTickets } from "@/lib/ticket-notifications"

interface SupportUser {
  id: string
  name: string | null
  email: string
  role: string
}

interface Client {
  id: string
  name: string | null
  email: string
  business?: {
    name: string
  } | null
  _count: {
    tickets: number
  }
}

interface TicketStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  closedTickets: number
  highPriorityTickets: number
  urgentPriorityTickets: number
}

interface PaginationData {
  total: number
  pages: number
  current: number
  perPage: number
}

export default function AdminTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [supportUsers, setSupportUsers] = useState<SupportUser[]>([])
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [clients, setClients] = useState<Client[]>([])
  const [clientFilter, setClientFilter] = useState("all")
  const [showClientFilterDialog, setShowClientFilterDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("anyone")
  const [sortField, setSortField] = useState<string>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // State for tickets with new messages
  const [ticketsWithNewMessages, setTicketsWithNewMessages] = useState<string[]>([])

  // Previous message counts for comparison
  const prevMessageCountsRef = useRef<Record<string, number>>({})

  // Get the notification context
  const { addNotification } = useNotifications()

  // Fetch tickets, support users, and stats on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Fetch tickets with pagination
      const ticketsResult = await getAllTickets(currentPage, itemsPerPage)
      if (ticketsResult.error) {
        toast({
          title: "Error",
          description: ticketsResult.error,
          variant: "destructive",
        })
      } else if (ticketsResult.tickets) {
        const fetchedTickets = ticketsResult.tickets as Ticket[]

        // Check for new messages by comparing message counts
        const newTicketsWithMessages: string[] = []

        fetchedTickets.forEach((ticket) => {
          const currentCount = ticket.messages?.length || 0
          const prevCount = prevMessageCountsRef.current[ticket.id] || 0

          // If message count increased, add to new messages list
          if (currentCount > prevCount) {
            newTicketsWithMessages.push(ticket.id)
            console.log(`Ticket ${ticket.id} has new messages: ${currentCount} > ${prevCount}`)
          }

          // Update the stored count
          prevMessageCountsRef.current[ticket.id] = currentCount
        })

        // Update tickets with new messages
        if (newTicketsWithMessages.length > 0) {
          setTicketsWithNewMessages((prev) => [...new Set([...prev, ...newTicketsWithMessages])])
          setHasNewMessages(true)
        }

        setTickets(fetchedTickets)

        // Check if pagination exists before accessing it
        if ("pagination" in ticketsResult && ticketsResult.pagination) {
          setPagination(ticketsResult.pagination as PaginationData)
        }

        // Check for new tickets
        const lastSeenTickets = getLastSeenTickets()
        const currentTicketIds = fetchedTickets.map((ticket) => ticket.id)

        // Find new tickets (those not in lastSeenTickets)
        const newTickets = fetchedTickets.filter((ticket) => !lastSeenTickets.includes(ticket.id))

        // Notify about new tickets
        if (newTickets.length > 0 && lastSeenTickets.length > 0) {
          // Only notify if we've loaded tickets before (to avoid notifications on first load)
          newTickets.forEach((ticket) => {
            addNotification(ticketEvents.ticketCreated(ticket.id, ticket.subject))
          })
        }

        // Update the last seen tickets
        updateLastSeenTickets(currentTicketIds)
      }

      // Fetch support users
      const usersResult = await getSupportUsers()
      if (usersResult.error) {
        toast({
          title: "Error",
          description: usersResult.error,
          variant: "destructive",
        })
      } else if (usersResult.supportUsers) {
        setSupportUsers(usersResult.supportUsers as SupportUser[])
      }

      // Fetch ticket stats
      const statsResult = await getTicketStats()
      if (statsResult.error) {
        toast({
          title: "Error",
          description: statsResult.error,
          variant: "destructive",
        })
      } else {
        setTicketStats(statsResult as TicketStats)
      }

      // Fetch clients for filtering
      const clientsResult = await getClients()
      if (clientsResult.error) {
        toast({
          title: "Error",
          description: clientsResult.error,
          variant: "destructive",
        })
      } else if (clientsResult.clients) {
        setClients(clientsResult.clients as Client[])
      }

      // Fetch unread message counts
      await fetchUnreadCounts()

      setIsLoading(false)
    }

    fetchData()

    // Set up auto-refresh timer
    refreshTimerRef.current = setInterval(refreshData, 30000) // Refresh every 30 seconds

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [currentPage, itemsPerPage])

  // Fetch unread message counts
  const fetchUnreadCounts = async () => {
    const currentUserId = "current-user-id" // Replace with actual current user ID from session
    const unreadResult = await getUnreadMessageCounts(currentUserId)

    if (!unreadResult.error && unreadResult.unreadCounts) {
      // Compare with previous unread counts to see if there are new messages
      const previousUnreadTotal: number = Object.values(unreadCounts).reduce(
        (sum: number, count) => sum + Number(count),
        0,
      )
      const newUnreadTotal: number = Object.values(unreadResult.unreadCounts).reduce(
        (sum: number, count) => sum + Number(count),
        0,
      )

      if (newUnreadTotal > previousUnreadTotal) {
        setHasNewMessages(true)
      }

      setUnreadCounts(unreadResult.unreadCounts)
    }
  }

  // Refresh data function
  const refreshData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    // Fetch tickets with pagination
    const ticketsResult = await getAllTickets(currentPage, itemsPerPage)
    if (!ticketsResult.error && ticketsResult.tickets) {
      const newTickets = ticketsResult.tickets as Ticket[]

      // Check for new messages by comparing message counts
      const newTicketsWithMessages: string[] = []

      newTickets.forEach((ticket) => {
        const currentCount = ticket.messages?.length || 0
        const prevCount = prevMessageCountsRef.current[ticket.id] || 0

        // If message count increased, add to new messages list
        if (currentCount > prevCount) {
          newTicketsWithMessages.push(ticket.id)
          console.log(`Ticket ${ticket.id} has new messages: ${currentCount} > ${prevCount}`)
        }

        // Update the stored count
        prevMessageCountsRef.current[ticket.id] = currentCount
      })

      // Update tickets with new messages
      if (newTicketsWithMessages.length > 0) {
        setTicketsWithNewMessages((prev) => [...new Set([...prev, ...newTicketsWithMessages])])
        setHasNewMessages(true)
      }

      // Check if pagination exists before accessing it
      if ("pagination" in ticketsResult && ticketsResult.pagination) {
        setPagination(ticketsResult.pagination as PaginationData)
      }

      setTickets(newTickets)
    }

    // Fetch ticket stats
    const statsResult = await getTicketStats()
    if (!statsResult.error) {
      setTicketStats(statsResult as TicketStats)
    }

    setIsRefreshing(false)
  }

  // Refresh selected ticket
  const refreshSelectedTicket = async () => {
    if (!selectedTicket) return

    const result = await getTicketDetails(selectedTicket.id)

    if (!result.error && result.ticket) {
      setSelectedTicket(result.ticket as Ticket)
      // Scroll to bottom of messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  // Manual refresh button handler
  const handleManualRefresh = async () => {
    setHasNewMessages(false)
    await refreshData()
    toast({
      title: "Refreshed",
      description: "Ticket data has been refreshed",
    })
  }

  // Fetch ticket details when a ticket is selected
  useEffect(() => {
    if (selectedTicket?.id && showTicketDialog) {
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

          // Mark ticket as viewed to reset unread count
          await updateTicketLastViewed(selectedTicket.id)

          // Refresh unread counts
          await fetchUnreadCounts()

          // Scroll to bottom of messages
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 100)
        }
      }

      fetchTicketDetails()
    }
  }, [selectedTicket?.id, showTicketDialog])

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.pages)) return
    setCurrentPage(page)
  }

  // Filter tickets based on search query, active tab, and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.creator?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      ticket.creator?.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "open" && ticket.status === "open") ||
      (activeTab === "in-progress" && ticket.status === "in-progress") ||
      (activeTab === "resolved" && ticket.status === "resolved") ||
      (activeTab === "closed" && ticket.status === "closed") ||
      (activeTab === "new-messages" && ticketsWithNewMessages.includes(ticket.id)) ||
      activeTab === "all"

    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    const matchesCategory = categoryFilter === "all" || ticket.category.toLowerCase() === categoryFilter.toLowerCase()

    const matchesAssignee =
      assigneeFilter === "anyone" ||
      (assigneeFilter === "unassigned" && !ticket.assigneeId) ||
      (assigneeFilter === "me" && ticket.assigneeId === "current-user-id") || // Replace with actual current user ID
      ticket.assigneeId === assigneeFilter

    const matchesClient = clientFilter === "all" || ticket.creatorId === clientFilter

    return matchesSearch && matchesTab && matchesPriority && matchesCategory && matchesAssignee && matchesClient
  })

  const viewTicketDetails = (ticket: Ticket) => {
    // Mark this ticket as read (no new messages)
    setTicketsWithNewMessages((prev) => prev.filter((id) => id !== ticket.id))

    setSelectedTicket(ticket)
    setShowTicketDialog(true)
    setHasNewMessages(false) // Reset new message indicator when viewing a ticket
  }

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    setIsSubmitting(true)

    // Set uploading files state if there are files
    if (selectedFiles.length > 0) {
      setIsUploadingFiles(true)
    }

    const result = await createMessage({ content: newMessage, ticketId: selectedTicket.id }, selectedFiles)

    // Reset uploading files state
    setIsUploadingFiles(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      // Add notification for message sent
      addNotification(ticketEvents.messageSent(selectedTicket.id, selectedTicket.subject))

      // Refresh ticket details
      const ticketResult = await getTicketDetails(selectedTicket.id)
      if (ticketResult.ticket) {
        setSelectedTicket(ticketResult.ticket as Ticket)
        // Scroll to bottom of messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }

      // Reset form
      setNewMessage("")
      setSelectedFiles([])
    }

    setIsSubmitting(false)
  }

  // Handle updating ticket status
  const handleUpdateTicketStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return

    setIsSubmitting(true)

    const result = await updateTicket({
      id: selectedTicket.id,
      status,
    })

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Ticket status updated to ${status}`,
      })

      // Add notification for status change
      addNotification(ticketEvents.statusChanged(selectedTicket.id, selectedTicket.subject, status))

      // Refresh ticket details
      const ticketResult = await getTicketDetails(selectedTicket.id)
      if (ticketResult.ticket) {
        setSelectedTicket(ticketResult.ticket as Ticket)
      }

      // Refresh all tickets
      await refreshData()
    }

    setIsSubmitting(false)
  }

  // Handle updating ticket priority
  const handleUpdateTicketPriority = async (priority: TicketPriority) => {
    if (!selectedTicket) return

    setIsSubmitting(true)

    const result = await updateTicket({
      id: selectedTicket.id,
      priority,
    })

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Ticket priority updated to ${priority}`,
      })

      // Add notification for priority change
      addNotification(ticketEvents.priorityChanged(selectedTicket.id, selectedTicket.subject, priority))

      // Refresh ticket details
      const ticketResult = await getTicketDetails(selectedTicket.id)
      if (ticketResult.ticket) {
        setSelectedTicket(ticketResult.ticket as Ticket)
      }

      // Refresh all tickets
      await refreshData()
    }

    setIsSubmitting(false)
  }

  // Handle assigning ticket to user
  const handleAssignTicket = async (userId: string | null) => {
    if (!selectedTicket) return

    setIsSubmitting(true)

    const result = await updateTicket({
      id: selectedTicket.id,
      assigneeId: userId,
    })

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: userId ? "Ticket assigned successfully" : "Ticket unassigned",
      })

      // Find assignee name if available
      if (userId) {
        const assignee = supportUsers.find((user) => user.id === userId)
        if (assignee) {
          // Add notification for assignment
          addNotification(
            ticketEvents.assigneeChanged(selectedTicket.id, selectedTicket.subject, assignee.name || assignee.email),
          )
        }
      } else {
        // Add notification for unassignment
        addNotification(ticketEvents.unassigned(selectedTicket.id, selectedTicket.subject))
      }

      // Refresh ticket details
      const ticketResult = await getTicketDetails(selectedTicket.id)
      if (ticketResult.ticket) {
        setSelectedTicket(ticketResult.ticket as Ticket)
      }

      // Refresh all tickets
      await refreshData()
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

      // Add notification for ticket deletion
      addNotification(ticketEvents.ticketDeleted(ticketToDelete))

      // Reset selected ticket if it was deleted
      if (selectedTicket && selectedTicket.id === ticketToDelete) {
        setSelectedTicket(null)
        setShowTicketDialog(false)
      }

      // Refresh all tickets and stats
      await refreshData()

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

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
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
          <Dialog open={showClientFilterDialog} onOpenChange={setShowClientFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Client Filter
                {clientFilter !== "all" && (
                  <Badge className="ml-2 bg-primary" variant="secondary">
                    1
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter by Client</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name || client.email} {client.business?.name ? `(${client.business.name})` : ""}
                        {client._count.tickets > 0 && ` - ${client._count.tickets} tickets`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowClientFilterDialog(false)}>Apply Filter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant={hasNewMessages ? "default" : "outline"}
            size="sm"
            className="flex items-center"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : hasNewMessages ? (
              <Bell className="mr-2 h-4 w-4" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {hasNewMessages ? "New Messages" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {ticketStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                <h3 className="text-2xl font-bold">{ticketStats.openTickets}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <h3 className="text-2xl font-bold">{ticketStats.inProgressTickets}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <h3 className="text-2xl font-bold">{ticketStats.resolvedTickets}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <h3 className="text-2xl font-bold">
                  {ticketStats.highPriorityTickets + ticketStats.urgentPriorityTickets}
                </h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical issue">Technical Issue</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="business changes">Business Changes</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-gray-500">Assigned to:</span>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anyone">Anyone</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="me">Me</SelectItem>
              {supportUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger
            value="new-messages"
            className={
              ticketsWithNewMessages.length > 0
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : ""
            }
          >
            New Messages {ticketsWithNewMessages.length > 0 && `(${ticketsWithNewMessages.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-3" />
                  <p className="text-gray-500">Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="font-medium text-lg mb-1">No tickets found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {searchQuery ||
                    priorityFilter !== "all" ||
                    categoryFilter !== "all" ||
                    assigneeFilter !== "anyone" ||
                    clientFilter !== "all"
                      ? "Try adjusting your filters"
                      : "There are no tickets in this category"}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">
                        <button className="flex items-center" onClick={() => handleSort("id")}>
                          ID {getSortIcon("id")}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        <button className="flex items-center" onClick={() => handleSort("subject")}>
                          Subject {getSortIcon("subject")}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-sm">Customer</th>
                      <th className="text-left p-4 font-medium text-sm">
                        <button className="flex items-center" onClick={() => handleSort("status")}>
                          Status {getSortIcon("status")}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        <button className="flex items-center" onClick={() => handleSort("priority")}>
                          Priority {getSortIcon("priority")}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-sm">Category</th>
                      <th className="text-left p-4 font-medium text-sm">
                        <button className="flex items-center" onClick={() => handleSort("updatedAt")}>
                          Last Updated {getSortIcon("updatedAt")}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-sm">Assigned To</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                          ticketsWithNewMessages.includes(ticket.id) ? "bg-green-100 dark:bg-green-900/20" : ""
                        }`}
                      >
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          <span className="font-mono text-sm">{ticket.id.substring(0, 8)}</span>
                        </td>
                        <td className="p-4 font-medium" onClick={() => viewTicketDetails(ticket)}>
                          <div className="flex items-center">
                            {ticket.subject}
                            {unreadCounts[ticket.id] > 0 && (
                              <Badge className="ml-2 bg-red-500" variant="secondary">
                                {unreadCounts[ticket.id]}
                              </Badge>
                            )}
                            {ticketsWithNewMessages.includes(ticket.id) && (
                              <Badge className="ml-2 bg-green-500" variant="secondary">
                                New
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          <div>
                            <p>{ticket.creator?.name || "Unknown"}</p>
                            <p className="text-sm text-gray-500">{ticket.creator?.email}</p>
                          </div>
                        </td>
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          <TicketStatusBadge status={ticket.status} />
                        </td>
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          <TicketPriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                            <Tag className="h-3 w-3 mr-1" />
                            {ticket.category}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-sm" onClick={() => viewTicketDetails(ticket)}>
                          {formatDate(ticket.updatedAt)}
                        </td>
                        <td className="p-4" onClick={() => viewTicketDetails(ticket)}>
                          {ticket.assignee ? (
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback>
                                  {ticket.assignee.name
                                    ? ticket.assignee.name.charAt(0).toUpperCase()
                                    : ticket.assignee.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{ticket.assignee.name || ticket.assignee.email}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => viewTicketDetails(ticket)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTicketToDelete(ticket.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.current - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(pagination.current * pagination.perPage, pagination.total)} of {pagination.total} tickets
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current page
                        return page === 1 || page === pagination.pages || Math.abs(page - currentPage) <= 1
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there are gaps
                        const prevPage = array[index - 1]
                        const showEllipsisBefore = prevPage && page - prevPage > 1

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsisBefore && <span className="px-2 text-gray-400">...</span>}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={pagination && currentPage === pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent
            className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
            aria-describedby="ticket-details-description"
          >
            <div id="ticket-details-description" className="sr-only">
              Ticket details and conversation history
            </div>
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
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleUpdateTicketStatus(value as TicketStatus)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Open" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={(value) => handleUpdateTicketPriority(value as TicketPriority)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Low" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p>{selectedTicket.creator?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-500">{selectedTicket.creator?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    {selectedTicket.category}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                  <Select
                    value={selectedTicket.assigneeId || "unassigned"}
                    onValueChange={(value) => handleAssignTicket(value === "unassigned" ? null : value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {supportUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <p className="text-sm">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-sm">{formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>

              {/* Ticket Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTicketToDelete(selectedTicket.id)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  Delete Ticket
                </Button>
                <Button variant="outline" size="sm" className="ml-auto" onClick={refreshSelectedTicket}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Conversation */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium">Conversation</h3>

                {selectedTicket.messages &&
                  selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.sender === selectedTicket.creatorId
                          ? "bg-blue-50 dark:bg-blue-900/20 ml-0 mr-12"
                          : message.sender === "system"
                            ? "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mx-auto text-center"
                            : "bg-gray-50 dark:bg-gray-800 ml-12 mr-0"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{message.senderName}</p>
                          <p className="text-xs text-gray-500">{formatDate(message.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                  ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== "closed" && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Reply</h3>
                  <Textarea
                    placeholder="Type your reply here..."
                    className="min-h-[100px] mb-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <FileUpload onFilesSelected={setSelectedFiles} maxFiles={5} maxSizeMB={10} className="mb-4" />
                  {isUploadingFiles && (
                    <div className="flex items-center text-sm text-amber-600 mb-2">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading attachments...
                    </div>
                  )}
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
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Ticket Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete this ticket? This action cannot be undone.</p>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Extracted components for better organization
function TicketStatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case "open":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <MessageSquare className="h-3 w-3 mr-1" />
          Open
        </Badge>
      )
    case "in-progress":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      )
    case "resolved":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      )
    case "closed":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Closed</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">{status}</Badge>
  }
}

function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case "urgent":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Urgent</Badge>
    case "high":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">High</Badge>
    case "medium":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Medium</Badge>
    case "low":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Low</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">{priority}</Badge>
  }
}

