"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type ThemeType = "light" | "dark" | "comfort"

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

// Create a default context value
const defaultThemeContext: ThemeContextType = {
  theme: "light",
  setTheme: () => null, // No-op function
}

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("light")
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("dashboard-theme") as ThemeType | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: ThemeType) => {
    // Remove all theme classes first
    document.documentElement.classList.remove("theme-light", "theme-dark", "theme-comfort")

    // Add the new theme class
    document.documentElement.classList.add(`theme-${newTheme}`)

    // Apply dark class for dark mode (for components that use dark: variants)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Store the theme preference
    localStorage.setItem("dashboard-theme", newTheme)
  }

  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  // Avoid rendering with incorrect theme
  if (!mounted) {
    return <>{children}</>
  }

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Instead of throwing an error, return the default context
  return context
}

