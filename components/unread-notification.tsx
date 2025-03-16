"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export function UnreadNotification() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [previousCount, setPreviousCount] = useState(0)
  const router = useRouter()

  // Function to fetch unread messages
  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch("/api/admin/unread-messages")
      if (!response.ok) throw new Error("Failed to fetch unread messages")

      const data = await response.json()

      // If there are new unread messages, show a toast
      if (data.totalUnread > previousCount && previousCount > 0) {
        toast({
          title: "New Messages",
          description: `You have ${data.totalUnread - previousCount} new unread message(s)`,
          variant: "default",
        })
      }

      setPreviousCount(unreadCount)
      setUnreadCount(data.totalUnread)
    } catch (error) {
      console.error("Error fetching unread messages:", error)
    }
  }

  // Fetch unread messages on component mount and every 30 seconds
  useEffect(() => {
    fetchUnreadMessages()

    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  // Navigate to tickets page when clicked
  const handleClick = () => {
    router.push("/admin/tickets")
  }

  // Don't render anything if there are no unread messages
  if (unreadCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 cursor-pointer" onClick={handleClick}>
      <div className="flex items-center justify-center bg-red-500 text-white p-3 rounded-full shadow-lg animate-pulse">
        <Bell className="h-5 w-5 mr-2" />
        <span className="font-bold">{unreadCount}</span>
      </div>
    </div>
  )
}

