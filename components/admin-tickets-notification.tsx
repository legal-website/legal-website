"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminTicketsNotification() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    checkUnreadMessages()
    const interval = setInterval(checkUnreadMessages, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const checkUnreadMessages = async () => {
    try {
      const response = await fetch("/api/admin/unread-messages")

      if (response.ok) {
        const data = await response.json()
        const newCount = data.totalUnread || 0

        setUnreadCount(newCount)
        setIsVisible(newCount > 0)
      }
    } catch (error) {
      console.error("Failed to fetch unread messages:", error)
    }
  }

  if (!isVisible) return null

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-600 dark:text-blue-400">New Messages</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You have {unreadCount} unread message{unreadCount === 1 ? "" : "s"} in your tickets.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-2 border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </AlertDescription>
    </Alert>
  )
}

