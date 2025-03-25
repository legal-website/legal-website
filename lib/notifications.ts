import { db } from "@/lib/db"

// Function to add a notification from server-side code
export async function addServerNotification(
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  userId: string,
  link?: string,
) {
  try {
    await db.notification.create({
      data: {
        title,
        message,
        type,
        read: false,
        link,
        userId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding server notification:", error)
    throw error
  }
}

// Function to track document activities
export async function trackDocumentActivity(
  action: "added" | "updated" | "deleted",
  documentName: string,
  userId: string,
  actorName: string,
  documentId?: string,
) {
  const title = `Document ${action}`
  const message = `${actorName} has ${action} the document "${documentName}"`
  const link = documentId ? `/dashboard/documents/${documentId}` : "/dashboard/documents"

  return addServerNotification(title, message, "info", userId, link)
}

// Function to track user activities
export async function trackUserActivity(
  action: string,
  targetName: string,
  userId: string,
  actorName: string,
  link?: string,
) {
  const title = `User Activity`
  const message = `${actorName} has ${action} ${targetName}`

  return addServerNotification(title, message, "info", userId, link)
}

