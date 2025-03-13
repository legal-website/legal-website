"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, Moon, Sun, MessageSquare, HelpCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/context/theme-context"
import { useToast } from "@/components/ui/use-toast"

// Define the notification interface
export interface Notification {
  id: number
  title: string
  description: string
  time: string
  read: boolean
  source: "invoices" | "system"
}

// Create a context for notifications that can be used across the app
import { createContext, useContext } from "react"

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "time" | "read">) => void
  markAsRead: (id: number) => void
  clearNotifications: () => void
  clearAllRead: () => void
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
  clearAllRead: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("adminNotifications")
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications))
      } catch (e) {
        console.error("Failed to parse saved notifications", e)
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("adminNotifications", JSON.stringify(notifications))
  }, [notifications])

  // Check for pending notifications
  useEffect(() => {
    const pendingNotifications = localStorage.getItem("pendingNotifications")
    if (pendingNotifications) {
      try {
        const parsedNotifications = JSON.parse(pendingNotifications)
        parsedNotifications.forEach((notification: any) => {
          const newNotification: Notification = {
            id: Date.now() + Math.random(), // Ensure unique ID
            title: notification.title,
            description: notification.description,
            time: "Just now",
            read: false,
            source: notification.source || "system",
          }
          setNotifications((prev) => [newNotification, ...prev])
        })
        // Clear pending notifications
        localStorage.removeItem("pendingNotifications")
      } catch (e) {
        console.error("Failed to process pending notifications", e)
      }
    }
  }, [])

  const addNotification = (notification: Omit<Notification, "id" | "time" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      time: "Just now",
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const clearAllRead = () => {
    setNotifications((prev) => prev.filter((notification) => !notification.read))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
        clearAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export default function AdminHeader() {
  const { notifications, markAsRead, clearAllRead } = useNotifications()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleClearAllRead = () => {
    clearAllRead()
    toast({
      title: "Notifications cleared",
      description: "All read notifications have been cleared",
    })
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "invoices":
        return <div className="w-2 h-2 mt-1.5 rounded-full mr-2 bg-[#22c984]" />
      default:
        return <div className="w-2 h-2 mt-1.5 rounded-full mr-2 bg-gray-500" />
    }
  }

  return (
    <header className="border-b px-6 py-3 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">{/* Logo or title could go here */}</div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" title="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" title="Messages">
            <MessageSquare className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 border-b flex justify-between items-center">
                <h3 className="font-medium">Notifications</h3>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleClearAllRead}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-3 cursor-pointer ${!notification.read ? "bg-gray-50 dark:bg-gray-800" : ""}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        {getSourceIcon(notification.source)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{notification.description}</p>
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full">
                    View all notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}

