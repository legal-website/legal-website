"use client"

import { useEffect } from "react"
import { applyCheckoutPatch } from "@/lib/checkout-patch"

export default function CheckoutPatch() {
  useEffect(() => {
    applyCheckoutPatch()
  }, [])

  return null // This component doesn't render anything
}

