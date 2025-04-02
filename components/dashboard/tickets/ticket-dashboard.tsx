"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserTickets, getTicketDetails } from "@/lib/actions/ticket-actions"
import TicketList from "./ticket-list"
import TicketDetailClient from "./ticket-detail-client"
import type { Ticket } from "@/types/ticket"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function TicketDashboard({
  initialTickets = [],
}: {
  initialTickets: Ticket[]
}) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // On mobile, hide sidebar by default
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false)
    } else {
      setShowSidebar(true)
    }
  }, [isMobile])

  // Extract ticket ID from path if available
  useEffect(() => {
    const ticketId = pathname.split("/").pop()
    if (ticketId && ticketId !== "tickets") {
      loadTicketDetails(ticketId)
    }
  }, [pathname])

  const loadTicketDetails = async (ticketId: string) => {
    setIsLoading(true)
    try {
      const { ticket } = await getTicketDetails(ticketId)
      if (ticket) {
        setSelectedTicket(ticket)
        // On mobile, hide the sidebar when a ticket is selected
        if (isMobile) {
          setShowSidebar(false)
        }
      }
    } catch (error) {
      console.error("Error loading ticket details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTickets = async () => {
    try {
      const { tickets: refreshedTickets } = await getUserTickets()
      if (refreshedTickets) {
        setTickets(refreshedTickets)
      }
    } catch (error) {
      console.error("Error refreshing tickets:", error)
    }
  }

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    router.push(`/dashboard/tickets/${ticket.id}`)
    // On mobile, hide the sidebar when a ticket is selected
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  const handleMessageSent = async () => {
    // Refresh the selected ticket to show the new message
    if (selectedTicket) {
      await loadTicketDetails(selectedTicket.id)
    }
    // Also refresh the ticket list to update any status changes
    await refreshTickets()
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Mobile toggle button */}
      <div className="md:hidden p-2 border-b flex items-center bg-background z-20">
        <Button variant="outline" size="sm" onClick={toggleSidebar} className="mr-2">
          <Menu className="h-4 w-4" />
          <span className="ml-2">Ticket List</span>
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "block" : "hidden"
        } md:block w-full md:w-80 border-r overflow-hidden flex-shrink-0 h-[calc(100%-3rem)] md:h-full z-10`}
      >
        <TicketList
          tickets={tickets}
          selectedTicketId={selectedTicket?.id}
          onTicketSelect={handleTicketSelect}
          onRefresh={refreshTickets}
        />
      </div>

      {/* Main content */}
      <div
        className={`flex-1 overflow-hidden ${showSidebar ? "hidden" : "block"} md:block h-[calc(100%-3rem)] md:h-full`}
      >
        {selectedTicket ? (
          <TicketDetailClient ticketId={selectedTicket.id} onMessageSent={handleMessageSent} isLoading={isLoading} />
        ) : (
          <div className="h-full flex items-center justify-center p-4 text-center">
            <div>
              <h3 className="text-lg font-medium">No ticket selected</h3>
              <p className="text-muted-foreground mt-1">Select a ticket from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

