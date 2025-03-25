"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  link?: string
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session } = useSession()
  const userId = session?.user?.id

  // Fetch notifications from API on mount and when user changes
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId])

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter((notification) => !notification.read).length
    setUnreadCount(count)
  }, [notifications])

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch notifications")

      const data = await response.json()
      setNotifications(
        data.notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })),
      )
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    if (!userId) return

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification: {
            ...notification,
            read: false,
          },
          userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to add notification")

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error("Error adding notification:", error)
    }
  }

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true, userId }),
      })

      if (!response.ok) throw new Error("Failed to mark notification as read")

      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to mark all notifications as read")

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Clear all notifications
  const clearNotifications = async () => {
    if (!userId || notifications.length === 0) return

    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to clear notifications")

      setNotifications([])
    } catch (error) {
      console.error("Error clearing notifications:", error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

