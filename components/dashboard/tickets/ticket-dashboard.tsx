"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Ticket } from "@/types/ticket"
import { getUserTickets, getTicketDetails } from "@/lib/actions/ticket-actions"
import TicketList from "@/components/dashboard/tickets/ticket-list"
import TicketDetail from "@/components/dashboard/tickets/ticket-detail"
import CreateTicketButton from "@/components/dashboard/tickets/create-ticket-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Search, MessageSquare, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TicketDashboard({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const pathname = usePathname() || ""
  const { toast } = useToast()

  // Extract ticket ID from URL if present
  useEffect(() => {
    const ticketIdMatch = pathname.match(/\/tickets\/([^/]+)/)
    if (ticketIdMatch && ticketIdMatch[1]) {
      const ticketId = ticketIdMatch[1]
      loadTicketDetails(ticketId)
    }
  }, [pathname])

  // Set up polling for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTickets(false)
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadTicketDetails = async (ticketId: string) => {
    setIsLoading(true)
    try {
      const { ticket, error } = await getTicketDetails(ticketId)
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }
      setSelectedTicket(ticket)
      // Update URL without full page refresh
      router.push(`/dashboard/tickets/${ticketId}`, { scroll: false })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load ticket details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTickets = async (showToast = true) => {
    setIsRefreshing(true)
    try {
      const { tickets: freshTickets, error } = await getUserTickets()
      if (error) {
        if (showToast) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          })
        }
        return
      }

      setTickets(freshTickets || [])

      // If we have a selected ticket, refresh its details too
      if (selectedTicket) {
        const { ticket: freshTicket } = await getTicketDetails(selectedTicket.id)
        if (freshTicket) {
          setSelectedTicket(freshTicket)
        }
      }

      if (showToast) {
        toast({
          title: "Refreshed",
          description: "Ticket data has been updated",
        })
      }
    } catch (error) {
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to refresh tickets",
          variant: "destructive",
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTicketSelect = (ticket: Ticket) => {
    loadTicketDetails(ticket.id)
  }

  const handleCreateSuccess = (ticketId: string) => {
    refreshTickets(false)
    loadTicketDetails(ticketId)
  }

  const handleMessageSent = async () => {
    if (selectedTicket) {
      const { ticket } = await getTicketDetails(selectedTicket.id)
      if (ticket) {
        setSelectedTicket(ticket)
      }
      refreshTickets(false)
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "open" && (ticket.status === "open" || ticket.status === "in-progress")) ||
      (activeTab === "resolved" && (ticket.status === "resolved" || ticket.status === "closed"))

    return matchesSearch && matchesTab
  })

  return (
    <div className="h-full flex flex-col md:flex-row mb-16 md:mb-48 overflow-hidden">
      {/* Sidebar with ticket list */}
      <div className="w-full md:w-80 lg:w-96 border-r flex flex-col overflow-hidden h-auto md:h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Support Tickets</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => refreshTickets()}
              disabled={isRefreshing}
              title="Refresh tickets"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <CreateTicketButton onSuccess={handleCreateSuccess}>
              <Button size="icon" variant="outline">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </CreateTicketButton>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Active</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TicketList
            tickets={filteredTickets}
            selectedTicketId={selectedTicket?.id}
            onTicketSelect={handleTicketSelect}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-16rem)] md:h-auto">
        {selectedTicket ? (
          <TicketDetail ticket={selectedTicket} onMessageSent={handleMessageSent} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No ticket selected</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Select a ticket from the list to view its details or create a new ticket to get started.
            </p>
            <CreateTicketButton onSuccess={handleCreateSuccess}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Ticket
              </Button>
            </CreateTicketButton>
          </div>
        )}
      </div>
    </div>
  )
}

