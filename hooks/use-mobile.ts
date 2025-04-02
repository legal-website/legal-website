"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Update the state initially
    setMatches(media.matches)

    // Define a callback function to handle changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Add the callback as a listener for changes to the media query
    media.addEventListener("change", listener)

    // Clean up
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768) // Consider screens smaller than 768px as mobile
      }

      // Initial check
      checkIfMobile()

      // Add event listener for window resize
      window.addEventListener("resize", checkIfMobile)

      // Clean up
      return () => window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  return isMobile
}

