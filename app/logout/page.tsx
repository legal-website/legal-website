"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  useEffect(() => {
    // Sign out the user and redirect to login page
    signOut({ callbackUrl: "/login" })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Logging out...</p>
      </div>
    </div>
  )
}

