"use client"

import { useEffect } from "react"

interface TawkChatWidgetProps {
  propertyId: string
  widgetId: string
}

export default function TawkChatWidget({ propertyId, widgetId }: TawkChatWidgetProps) {
  useEffect(() => {
    // Don't load if already loaded
    if (typeof window !== "undefined" && window.Tawk_API) return

    // Save the current time
    if (typeof window !== "undefined") {
      window.Tawk_LoadStart = new Date()
    }

    // Create script element
    const script = document.createElement("script")
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")

    // Add script to document
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      // Remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }

      // Clean up global variables
      if (typeof window !== "undefined") {
        delete window.Tawk_API
        delete window.Tawk_LoadStart
      }
    }
  }, [propertyId, widgetId])

  return null
}

