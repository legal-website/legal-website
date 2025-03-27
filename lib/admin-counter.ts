// This file provides utilities for managing admin sidebar counters

// Define the type for counter values
export type CounterValue = number | string | null // Changed to allow null instead of undefined

// Create a custom event to update counters
export const updateSidebarCounter = (key: string, value: CounterValue): void => {
  // Create and dispatch a custom event
  const event = new CustomEvent("admin:counter-update", {
    detail: { key, value },
  })

  window.dispatchEvent(event)
}

// Increment a numeric counter
export const incrementSidebarCounter = (key: string): void => {
  // First, we need to get the current value if possible
  // Since we can't directly access the React state, we'll dispatch an event
  // that the sidebar component will handle
  const event = new CustomEvent("admin:counter-increment", {
    detail: { key },
  })

  window.dispatchEvent(event)
}

// Reset a counter to zero or remove it
export const resetSidebarCounter = (key: string): void => {
  updateSidebarCounter(key, 0)
}

// Set a badge to "New"
export const setNewBadge = (key: string): void => {
  updateSidebarCounter(key, "New")
}

// Remove a badge completely
export const removeBadge = (key: string): void => {
  updateSidebarCounter(key, null) // Changed to null instead of undefined
}

