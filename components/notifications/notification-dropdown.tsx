"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { useNotifications } from "@/context/notification-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`
  }

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.link) {
      // Navigation will be handled by Link component
      setIsOpen(false)
    }
  }

  // Get background color based on notification type
  const getNotificationBgColor = (type: string, read: boolean) => {
    const baseClass = read ? "opacity-70 " : ""

    switch (type) {
      case "info":
        return baseClass + "bg-blue-50"
      case "success":
        return baseClass + "bg-green-50"
      case "warning":
        return baseClass + "bg-yellow-50"
      case "error":
        return baseClass + "bg-red-50"
      default:
        return baseClass + "bg-gray-50"
    }
  }

  // Get border color based on notification type
  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case "info":
        return "border-blue-500"
      case "success":
        return "border-green-500"
      case "warning":
        return "border-yellow-500"
      case "error":
        return "border-red-500"
      default:
        return "border-gray-300"
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto rounded-md shadow-lg z-50 bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications}>
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors",
                    getNotificationBgColor(notification.type, notification.read),
                    "border-l-4",
                    getNotificationBorderColor(notification.type),
                  )}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className="block"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </Link>
                  ) : (
                    <div onClick={() => handleNotificationClick(notification)}>
                      <div className="flex justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

