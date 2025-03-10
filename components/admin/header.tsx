"use client"

import { useState } from "react"
import { Bell, Search, Moon, Sun, MessageSquare, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/context/theme-context"

export default function AdminHeader() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New user registered",
      description: "John Smith just created an account",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Compliance alert",
      description: "5 users have pending document submissions",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "System update",
      description: "New features will be deployed tonight",
      time: "3 hours ago",
      read: true,
    },
  ])

  const { theme, setTheme } = useTheme()

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <header className="border-b px-6 py-3 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center w-1/3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full"
            />
          </div>
        </div>

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
              <div className="p-2 border-b">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer ${!notification.read ? "bg-gray-50 dark:bg-gray-800" : ""}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-2 h-2 mt-1.5 rounded-full mr-2 ${
                          !notification.read ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{notification.description}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  View all notifications
                </Button>
              </div>
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

