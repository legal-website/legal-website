import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserTickets, getTicketDetails } from "@/lib/actions/ticket-actions"
import TicketDashboard from "@/components/dashboard/tickets/ticket-dashboard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ticket Details",
  description: "View and manage your support ticket",
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const { tickets } = await getUserTickets()
  const { ticket, error } = await getTicketDetails(params.id)

  if (error) {
    redirect("/dashboard/tickets")
  }

  return (
    <div className="mb-20 sm:mb-24 md:mb-32 lg:mb-40">
      <TicketDashboard initialTickets={tickets || []} />
    </div>
  )
}

