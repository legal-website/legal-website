import type React from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support Tickets",
  description: "View and manage your support tickets",
}

export default async function TicketsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

