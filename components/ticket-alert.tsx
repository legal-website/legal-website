"use client"

import { useState, useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function TicketAlert() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUnreadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/unread-messages")
      if (!response.ok) throw new Error("Failed to fetch unread messages")

      const data = await response.json()
      setUnreadCount(data.totalUnread)
    } catch (error) {
      console.error("Error fetching unread messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadMessages()

    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  if (unreadCount === 0) return null

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Unread Messages</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-700">
          You have {unreadCount} unread message{unreadCount !== 1 ? "s" : ""} across your tickets.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          onClick={fetchUnreadMessages}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

