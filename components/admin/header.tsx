"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, Moon, Sun, MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/context/theme-context"
import { useToast } from "@/components/ui/use-toast"

// Update the Notification interface to include "tickets" as a source type
export interface Notification {
  id: string
  title: string
  description: string
  time: string // Changed from Date to string
  read: boolean
  source: "users" | "pending" | "invoices" | "tickets" | "roles" | "system"
  ticketId?: string
}

// Create a context for notifications that can be used across the app
import { createContext, useContext } from "react"
import { getTicketsWithNewMessages, getStoredMessageCounts, formatTicketId } from "@/lib/ticket-notifications"

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "time" | "read">) => void
  markAsRead: (id: string) => void // Changed from number to string
  clearNotifications: () => void
  clearAllRead: () => void
  ticketsWithNewMessages?: string[]
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
  clearAllRead: () => {},
  ticketsWithNewMessages: [],
})

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  return {
    ...context,
    ticketsWithNewMessages: context.notifications
      .filter((n) => n.source === "tickets")
      .map((n) => n.ticketId)
      .filter(Boolean) as string[],
  }
}

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
            id: String(Date.now() + Math.random()), // Convert to string
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

  // Add a useEffect to check for ticket notifications
  useEffect(() => {
    // Check for ticket notifications
    const checkTicketNotifications = () => {
      const ticketNotifications = localStorage.getItem("ticketNotifications")
      if (ticketNotifications) {
        try {
          const parsedNotifications = JSON.parse(ticketNotifications)
          if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
            parsedNotifications.forEach((notification: any) => {
              const newNotification: Notification = {
                id: String(Date.now() + Math.random()), // Convert to string
                title: notification.title || "New ticket message",
                description: notification.description || "You have a new message in a ticket",
                time: "Just now",
                read: false,
                source: "tickets",
              }
              setNotifications((prev) => [newNotification, ...prev])
            })
            // Clear ticket notifications
            localStorage.removeItem("ticketNotifications")
          }
        } catch (e) {
          console.error("Failed to process ticket notifications", e)
        }
      }
    }

    // Check for ticket notifications on mount
    checkTicketNotifications()

    // Set up interval to check for new ticket notifications
    const intervalId = setInterval(checkTicketNotifications, 30000) // Check every 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  const addNotification = (notification: Omit<Notification, "id" | "time" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: String(Date.now()), // Convert to string
      time: "Just now",
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    // Changed from number to string
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

  // Add this function near the other notification check functions
  const checkForTicketNotifications = () => {
    try {
      // Check if there are any tickets with new messages
      const ticketsWithNewMessages = getTicketsWithNewMessages()
      if (ticketsWithNewMessages.length > 0) {
        // Get the stored message counts to get ticket subjects
        const storedCounts = getStoredMessageCounts()

        // If there's just one ticket with new messages
        if (ticketsWithNewMessages.length === 1) {
          const ticketId = ticketsWithNewMessages[0]
          const ticketInfo = storedCounts[ticketId]
          if (ticketInfo) {
            addNotification({
              title: "New Message in Ticket",
              description: `You have a new message in ticket #${formatTicketId(ticketId)}: ${ticketInfo.subject}`,
              source: "tickets",
              ticketId,
            })
          }
        } else {
          // Multiple tickets with new messages
          addNotification({
            title: "New Messages in Tickets",
            description: `You have new messages in ${ticketsWithNewMessages.length} tickets`,
            source: "tickets",
          })
        }
      }

      // Check for unread ticket messages count
      const unreadTicketsData = localStorage.getItem("unreadTicketMessages")
      if (unreadTicketsData) {
        const unreadTickets = JSON.parse(unreadTicketsData)
        const totalUnread = Object.values(unreadTickets).reduce((sum: number, count: any) => sum + Number(count), 0)

        if (totalUnread > 0) {
          // Add a notification for unread messages
          addNotification({
            title: "Unread Ticket Messages",
            description: `You have ${totalUnread} unread message${totalUnread > 1 ? "s" : ""} in your tickets`,
            source: "tickets",
          })

          // Clear the localStorage entry to avoid duplicate notifications
          localStorage.removeItem("unreadTicketMessages")
        }
      }
    } catch (error) {
      console.error("Error checking for ticket notifications:", error)
    }
  }

  const checkForPendingNotifications = () => {
    // Implementation for checking pending notifications
    // This is a placeholder, replace with your actual logic
    console.log("Checking for pending notifications")
  }

  const checkForInvoiceNotifications = () => {
    // Implementation for checking invoice notifications
    // This is a placeholder, replace with your actual logic
    console.log("Checking for invoice notifications")
  }

  // Find the useEffect that calls checkForPendingNotifications and add:
  useEffect(() => {
    checkForPendingNotifications()
    checkForInvoiceNotifications() // If this exists
    checkForTicketNotifications() // Add this line
  }, [])

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
  // At the top of the AdminHeader component, add:
  const [newMessageTicketsCount, setNewMessageTicketsCount] = useState(0)

  // Add a useEffect to check for tickets with new messages
  useEffect(() => {
    const checkNewMessageTickets = () => {
      const ticketsWithNewMessages = getTicketsWithNewMessages()
      setNewMessageTicketsCount(ticketsWithNewMessages.length)
    }

    // Check on mount
    checkNewMessageTickets()

    // Set up interval to check regularly
    const intervalId = setInterval(checkNewMessageTickets, 10000) // Check every 10 seconds

    return () => clearInterval(intervalId)
  }, [])

  const { notifications, markAsRead, clearAllRead } = useNotifications()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Update the unreadCount calculation
  const unreadCount = notifications.filter((notification) => !notification.read).length + newMessageTicketsCount

  const handleClearAllRead = () => {
    clearAllRead()
    toast({
      title: "Notifications cleared",
      description: "All read notifications have been cleared",
    })
  }

  // Update the getSourceIcon function to handle ticket notifications
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "invoices":
        return <div className="w-2 h-2 mt-1.5 rounded-full mr-2 bg-green-500" />
      case "tickets":
        return <div className="w-2 h-2 mt-1.5 rounded-full mr-2 bg-blue-500" />
      default:
        return <div className="w-2 h-2 mt-1.5 rounded-full mr-2 bg-gray-500" />
    }
  }

  const isValidSource = (source: string): boolean => {
    return ["system", "tickets", "payments", "users", "subscriptions", "pending", "invoices", "roles"].includes(source)
  }

  return (
    <header className="border-b px-6 py-3 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">{/* Logo or title could go here */}</div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Messages" className="relative">
                <MessageSquare className="h-5 w-5" />
                {newMessageTicketsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {newMessageTicketsCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 border-b">
                <h3 className="font-medium">Ticket Messages</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {newMessageTicketsCount > 0 ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3"
                    onClick={() => (window.location.href = "/admin/tickets")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <div>
                      <p className="font-medium text-sm">New Ticket Messages</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        You have {newMessageTicketsCount} ticket{newMessageTicketsCount > 1 ? "s" : ""} with new
                        messages
                      </p>
                    </div>
                  </Button>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <p>No new messages</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => (window.location.href = "/admin/tickets")}
                >
                  View all tickets
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

