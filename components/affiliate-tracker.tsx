"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if there's a referral code in the URL
    const refCode = searchParams?.get("ref")

    if (refCode) {
      console.log("Referral code detected:", refCode)

      // Store the referral code in localStorage
      localStorage.setItem("affiliateCode", refCode)

      // Record the click via API
      fetch("/api/affiliate/clicks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: refCode }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Affiliate click recorded:", data)
        })
        .catch((error) => {
          console.error("Error recording affiliate click:", error)
        })
    }
  }, [searchParams])

  return null // This component doesn't render anything
}

