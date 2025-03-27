// This file provides utilities for managing admin sidebar counters

// Define the type for counter values
export type CounterValue = number | string | null

// Create a custom event to update counters
export const updateSidebarCounter = (key: string, value: CounterValue): void => {
  // Create and dispatch a custom event
  const event = new CustomEvent("admin:counter-update", {
    detail: { key, value },
  })

  // Dispatch the event
  window.dispatchEvent(event)

  // Also store in localStorage for persistence across page refreshes
  const counters = JSON.parse(localStorage.getItem("admin-counters") || "{}")
  counters[key] = value
  localStorage.setItem("admin-counters", JSON.stringify(counters))
}

// Increment a numeric counter
export const incrementSidebarCounter = (key: string): void => {
  // Get current value from localStorage
  const counters = JSON.parse(localStorage.getItem("admin-counters") || "{}")
  const currentValue = counters[key]

  // Only increment if it's a number
  if (typeof currentValue === "number") {
    updateSidebarCounter(key, currentValue + 1)
  } else {
    // If it's not a number, set it to 1
    updateSidebarCounter(key, 1)
  }
}

// Reset a counter to zero
export const resetSidebarCounter = (key: string): void => {
  updateSidebarCounter(key, 0)
}

// Set a badge to "New"
export const setNewBadge = (key: string): void => {
  updateSidebarCounter(key, "New")
}

// Remove a badge completely
export const removeBadge = (key: string): void => {
  updateSidebarCounter(key, null)
}

// Get all counters (useful for debugging)
export const getAllCounters = (): Record<string, CounterValue> => {
  return JSON.parse(localStorage.getItem("admin-counters") || "{}")
}

// Clear all counters (useful for testing or resetting)
export const clearAllCounters = (): void => {
  localStorage.setItem("admin-counters", "{}")

  // Also dispatch an event to notify the sidebar
  const event = new CustomEvent("admin:counter-clear")
  window.dispatchEvent(event)
}

