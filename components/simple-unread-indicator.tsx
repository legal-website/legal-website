"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export function SimpleUnreadIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check for unread messages on mount
    checkUnreadMessages()

    // Set up interval to check periodically
    const interval = setInterval(checkUnreadMessages, 30000) // every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const checkUnreadMessages = async () => {
    try {
      // Simple fetch request to get unread messages
      const response = await fetch("/api/admin/unread-messages")

      if (response.ok) {
        const data = await response.json()
        const newCount = data.totalUnread || 0

        // If we have new messages and the count increased, show a toast
        if (newCount > 0 && newCount > unreadCount) {
          toast({
            title: "New Messages",
            description: `You have ${newCount} unread message${newCount === 1 ? "" : "s"}`,
            duration: 5000,
          })
        }

        setUnreadCount(newCount)
      }
    } catch (error) {
      console.error("Failed to fetch unread messages:", error)
    }
  }

  // If no unread messages, don't render anything
  if (unreadCount === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 cursor-pointer" onClick={() => router.push("/admin/tickets")}>
      <div className="bg-red-500 text-white rounded-full p-4 shadow-lg flex items-center space-x-2 animate-pulse">
        <Bell className="h-6 w-6" />
        <span className="font-bold">{unreadCount} unread</span>
      </div>
    </div>
  )
}

