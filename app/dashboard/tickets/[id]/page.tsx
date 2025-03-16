import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getTicketDetails } from "@/lib/actions/ticket-actions"
import TicketDetailClient from "@/components/dashboard/tickets/ticket-detail-client"
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

  const { ticket, error } = await getTicketDetails(params.id)

  if (error) {
    throw new Error(error)
  }

  return <TicketDetailClient ticket={ticket} />
}

