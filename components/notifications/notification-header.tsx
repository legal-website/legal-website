"use client"

import { useSession } from "next-auth/react"
import { NotificationDropdown } from "./notification-dropdown"

export function NotificationHeader() {
  const { data: session } = useSession()

  return (
    <header className="h-[20px] flex items-center justify-end px-4 border-b bg-white">
      {session && (
        <div className="flex items-center">
          <NotificationDropdown />
        </div>
      )}
    </header>
  )
}

