"use client"

import { UserProvider } from "@/context/user-context"
import LiveSupportWidget from "./live-support-widget"

export default function ChatProvider() {
  return (
    <UserProvider>
      <LiveSupportWidget />
    </UserProvider>
  )
}

