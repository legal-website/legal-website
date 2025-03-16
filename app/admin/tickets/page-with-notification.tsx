"use client"

import { AdminTicketsNotification } from "@/components/admin-tickets-notification"
import AdminTicketsPage from "./page" // Import the original tickets page component

export default function AdminTicketsPageWithNotification() {
  return (
    <>
      <AdminTicketsNotification />
      <AdminTicketsPage />
    </>
  )
}

