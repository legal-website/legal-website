"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get("ref")

    if (refCode) {
      // Record the click via API
      fetch("/api/affiliate/clicks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: refCode,
          referrer: document.referrer,
        }),
      }).catch((error) => {
        console.error("Error recording affiliate click:", error)
      })
    }
  }, [searchParams])

  return null
}

