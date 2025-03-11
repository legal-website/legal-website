"use client"

import { useEffect } from "react"
import { findErrorSource } from "@/lib/find-error-source"

export default function ErrorTracker() {
  useEffect(() => {
    findErrorSource()
  }, [])

  return null // This component doesn't render anything
}

