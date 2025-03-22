"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

// This is the component that uses useSearchParams
function AffiliateTrackerContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Add null check for searchParams
    if (!searchParams) return

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

// This is the main component that will be imported elsewhere
import { Suspense } from "react"

export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <AffiliateTrackerContent />
    </Suspense>
  )
}

