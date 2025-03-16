"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { getUnreadMessageCounts } from "@/lib/actions/admin-ticket-actions"

export function UnreadMessagesIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch unread counts on mount and every 30 seconds
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCounts = async () => {
    try {
      const result = await getUnreadMessageCounts()

      if (!result.error && result.unreadCounts) {
        // Calculate total unread messages
        const total = Object.values(result.unreadCounts).reduce((sum: number, count) => sum + Number(count), 0)

        // Only show notification if there are unread messages
        if (total > 0) {
          setUnreadCount(total)
          setIsVisible(true)

          // If this is a new notification (count increased), show a toast
          if (total > unreadCount) {
            toast({
              title: "New Messages",
              description: `You have ${total} unread message${total === 1 ? "" : "s"}`,
              duration: 5000,
            })
          }
        } else {
          setIsVisible(false)
        }
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error)
    }
  }

  const handleClick = () => {
    router.push("/admin/tickets")
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <Button
        onClick={handleClick}
        className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
      >
        <Bell className="h-6 w-6" />
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-none px-2 py-1 min-w-[24px] h-6">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      </Button>
    </div>
  )
}

