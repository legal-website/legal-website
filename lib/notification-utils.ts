import type { Notification } from "@/components/admin/header"

// Function to format time difference
export function formatTimeDifference(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }
}

// User-related notification events
export const userEvents = {
  userRegistered: (name: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "New user registered",
    description: `${name} just created an account`,
    source: "users",
  }),

  emailVerified: (email: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Email verified",
    description: `User ${email} has verified their email`,
    source: "users",
  }),

  userStatusChanged: (name: string, status: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "User status updated",
    description: `${name}'s status changed to ${status}`,
    source: "users",
  }),

  userRoleChanged: (name: string, role: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "User role changed",
    description: `${name}'s role updated to ${role}`,
    source: "roles",
  }),

  userDeleted: (name: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "User deleted",
    description: `${name}'s account has been deleted`,
    source: "users",
  }),
}

// LLC-related notification events
export const llcEvents = {
  llcStatusChanged: (businessName: string, status: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "LLC status updated",
    description: `Business '${businessName}' status changed to ${status}`,
    source: "pending",
  }),

  llcCreated: (businessName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "New LLC created",
    description: `Business '${businessName}' has been created`,
    source: "pending",
  }),

  llcApproved: (businessName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "LLC approved",
    description: `Business '${businessName}' has been approved`,
    source: "pending",
  }),

  llcRejected: (businessName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "LLC rejected",
    description: `Business '${businessName}' has been rejected`,
    source: "pending",
  }),
}

