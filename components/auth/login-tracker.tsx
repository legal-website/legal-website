"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export function LoginTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only run this effect when the user is authenticated
    if (status === "authenticated" && session) {
      const trackLogin = async () => {
        try {
          // Get IP address (this is a simple approach, you might want to use a service)
          const ipResponse = await fetch("https://api.ipify.org?format=json")
          const ipData = await ipResponse.json()
          const ipAddress = ipData.ip || "Unknown"

          // Send login data to the API
          await fetch("/api/auth/login-tracking", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ipAddress,
              userAgent: navigator.userAgent,
            }),
          })
        } catch (error) {
          console.error("Error tracking login:", error)
        }
      }

      trackLogin()
    }
  }, [session, status])

  // This component doesn't render anything
  return null
}

