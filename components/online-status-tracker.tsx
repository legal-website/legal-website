"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export function OnlineStatusTracker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    // Only track online status if user is logged in
    if (!session?.user) return

    // Function to ping the server and update online status
    const updateOnlineStatus = async () => {
      try {
        await fetch("/api/admin/users/online-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (error) {
        console.error("Error updating online status:", error)
      }
    }

    // Update status immediately
    updateOnlineStatus()

    // Set up interval to update status every minute
    intervalRef.current = setInterval(updateOnlineStatus, 60000)

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateOnlineStatus()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [session])

  // This component doesn't render anything visible
  return null
}

