"use client"

import { type RefObject, useEffect } from "react"

type Event = MouseEvent | TouchEvent

// Modified to accept null in the ref type
export const useOnClickOutside = (ref: RefObject<HTMLElement | null>, handler: (event: Event) => void) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current
      if (!el || el.contains((event.target as Node) || null)) {
        return
      }

      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

