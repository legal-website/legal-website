"use client"

import { useState, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

export function SimpleMessageAlert() {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const router = useRouter()

  // Function to check for unread messages
  const checkUnreadMessages = async () => {
    try {
      // Simple approach: just check if there are any recent messages
      const response = await fetch("/api/admin/check-messages")
      if (!response.ok) return

      const data = await response.json()
      setHasUnreadMessages(data.hasUnreadMessages)
    } catch (error) {
      console.error("Error checking messages:", error)
    }
  }

  // Check for unread messages on component mount and every 30 seconds
  useEffect(() => {
    checkUnreadMessages()

    const interval = setInterval(checkUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  // Navigate to tickets page when clicked
  const handleClick = () => {
    router.push("/admin/tickets")
  }

  // Don't render anything if there are no unread messages
  if (!hasUnreadMessages) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 cursor-pointer" onClick={handleClick}>
      <div className="flex items-center justify-center bg-red-500 text-white p-3 rounded-full shadow-lg animate-pulse">
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="font-bold">New Messages</span>
      </div>
    </div>
  )
}

