"use client"

import type { Ticket } from "@/types/ticket"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function TicketList({
  tickets,
  selectedTicketId,
  onTicketSelect,
}: {
  tickets: Ticket[]
  selectedTicketId?: string
  onTicketSelect: (ticket: Ticket) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500"
      case "in-progress":
        return "bg-yellow-500"
      case "resolved":
        return "bg-green-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">No tickets found. Create a new ticket to get started.</div>
    )
  }

  return (
    <div className="divide-y">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => onTicketSelect(ticket)}
          className={cn(
            "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
            selectedTicketId === ticket.id && "bg-muted",
          )}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-medium line-clamp-1">{ticket.subject}</h3>
            <Badge className={cn("ml-2 shrink-0", getStatusColor(ticket.status))}>{ticket.status}</Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{ticket.category}</span>
            <span>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

