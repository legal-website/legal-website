"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSession } from "next-auth/react"

interface UserContextType {
  userName: string | null
  userEmail: string | null
  isLoading: boolean
}

const UserContext = createContext<UserContextType>({
  userName: null,
  userEmail: null,
  isLoading: true,
})

export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession()
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile when session is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          // First try to get data from session
          if (session.user.name) {
            setUserName(session.user.name)
          }

          if (session.user.email) {
            setUserEmail(session.user.email)
          }

          // Then try to get more detailed data from API
          const response = await fetch("/api/user/profile")
          if (response.ok) {
            const userData = await response.json()
            if (userData.name) {
              setUserName(userData.name)
            }
            if (userData.email) {
              setUserEmail(userData.email)
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        } finally {
          setIsLoading(false)
        }
      } else if (status === "unauthenticated") {
        setUserName(null)
        setUserEmail(null)
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [session, status])

  return <UserContext.Provider value={{ userName, userEmail, isLoading }}>{children}</UserContext.Provider>
}

