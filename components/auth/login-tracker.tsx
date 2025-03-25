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
          // Don't rely solely on external IP services which might fail
          // Let the server determine the IP from headers
          await fetch("/api/auth/login-tracking", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userAgent: navigator.userAgent,
              // Send additional client info that might help with identification
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: navigator.language,
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

