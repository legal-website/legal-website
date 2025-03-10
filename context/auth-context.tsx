"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { signIn } from "next-auth/react"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  businessId: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    async function loadUserFromSession() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("Failed to load user session", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) return false

      const data = await res.json()
      setUser(data.user)
      return true
    } catch (error) {
      console.error("Login failed", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      if (!res.ok) return false

      return true
    } catch (error) {
      console.error("Registration failed", error)
      return false
    }
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signIn("google", { redirect: false })
      return !result?.error
    } catch (error) {
      console.error("Google sign-in failed", error)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

