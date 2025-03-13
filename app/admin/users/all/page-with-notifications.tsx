// This is just a small example of how to use the notification system in the user pages
// You would need to integrate this into your existing pages

"use client"

import { useNotifications } from "@/components/admin/header"
import { userEvents } from "@/lib/notification-utils"
import { Button } from "@/components/ui/button"

export function NotificationDemo() {
  const { addNotification } = useNotifications()

  const handleUserRegistered = () => {
    addNotification(userEvents.userRegistered("Jane Doe"))
  }

  const handleEmailVerified = () => {
    addNotification(userEvents.emailVerified("jane@example.com"))
  }

  const handleStatusChanged = () => {
    addNotification(userEvents.userStatusChanged("Jane Doe", "Active"))
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Notification Demo</h2>
      <div className="flex flex-col space-y-2">
        <Button onClick={handleUserRegistered}>Simulate User Registration</Button>
        <Button onClick={handleEmailVerified}>Simulate Email Verification</Button>
        <Button onClick={handleStatusChanged}>Simulate Status Change</Button>
      </div>
    </div>
  )
}

// You would then integrate this into your existing pages by adding the useNotifications hook
// and calling addNotification at the appropriate times

