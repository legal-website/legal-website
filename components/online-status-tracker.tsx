"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export function OnlineStatusTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only run if the user is authenticated
    if (status !== "authenticated" || !session?.user) {
      return
    }

    // Function to update online status
    const updateOnlineStatus = async () => {
      try {
        await fetch("/api/admin/users/online-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (error) {
        console.error("Failed to update online status:", error)
      }
    }

    // Update status immediately when component mounts
    updateOnlineStatus()

    // Set up interval to update status periodically
    const interval = setInterval(updateOnlineStatus, 60000) // Every minute

    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]
    let activityTimeout: NodeJS.Timeout | null = null

    const handleUserActivity = () => {
      // Debounce activity updates to avoid too many requests
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
      activityTimeout = setTimeout(updateOnlineStatus, 1000)
    }

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity)
    })

    // Update status when user is about to leave
    window.addEventListener("beforeunload", updateOnlineStatus)

    // Clean up
    return () => {
      if (interval) clearInterval(interval)
      if (activityTimeout) clearTimeout(activityTimeout)

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })

      window.removeEventListener("beforeunload", updateOnlineStatus)
    }
  }, [session, status])

  // This component doesn't render anything
  return null
}

