import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserTickets } from "@/lib/actions/ticket-actions"
import TicketDashboard from "@/components/dashboard/tickets/ticket-dashboard"
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

  return <TicketDashboard initialTickets={tickets || []} />
}

