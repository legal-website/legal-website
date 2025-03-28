"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardAccessCheck({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [canAccessDashboard, setCanAccessDashboard] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/user/personal-details-status")

        if (response.ok) {
          const data = await response.json()

          // User can access dashboard if they have approved personal details AND redirect is disabled
          const hasAccess =
            data.personalDetails &&
            data.personalDetails.status === "approved" &&
            data.personalDetails.isRedirectDisabled === true

          setCanAccessDashboard(hasAccess)

          // If they don't have access, redirect them
          if (!hasAccess) {
            router.push("/Personal-details")
          }
        } else {
          // If API call fails, redirect to be safe
          router.push("/Personal-details")
        }
      } catch (error) {
        console.error("Error checking dashboard access:", error)
        router.push("/Personal-details")
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  // Only render children if user can access dashboard
  return canAccessDashboard ? children : null
}

