"use client"

import { TicketAlert } from "@/components/ticket-alert"
import AdminTicketsPage from "./page"

export default function TicketsPageWithAlert() {
  return (
    <>
      <TicketAlert />
      <AdminTicketsPage />
    </>
  )
}

