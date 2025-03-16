import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserTickets } from "@/lib/actions/ticket-actions"
import TicketList from "@/components/dashboard/tickets/ticket-list"
import CreateTicketButton from "@/components/dashboard/tickets/create-ticket-button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support Tickets",
  description: "View and manage your support tickets",
}

export default async function TicketsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const { tickets, error } = await getUserTickets()

  if (error) {
    throw new Error(error)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <CreateTicketButton />
      </div>

      <TicketList tickets={tickets || []} />
    </div>
  )
}

