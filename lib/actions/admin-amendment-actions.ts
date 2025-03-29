"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function getRecentAmendments(limit = 3) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin can view all amendments
  if (session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    // Fetch amendments with only user information
    // @ts-ignore - Prisma client type issue
    const allAmendments = await db.amendment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        // Only include user since we know it exists
        user: true,
      },
    })

    // Filter for pending amendments
    const pendingAmendments = allAmendments
      .filter((amendment: any) => {
        const status = amendment.status || ""
        return (
          status.toLowerCase() === "pending" ||
          status.toLowerCase() === "waiting_for_approval" ||
          status.toLowerCase() === "in_review"
        )
      })
      .slice(0, limit)

    // Process amendments to ensure consistent format
    const processedAmendments = pendingAmendments.map((amendment: any) => {
      // Get user information from user property
      const userName = amendment.user?.name || amendment.user?.email || "Unknown User"

      const userId = amendment.userId || "unknown-user"

      return {
        id: amendment.id,
        // Use type as title if it exists, otherwise use a default
        title: amendment.title || amendment.type || amendment.name || "Amendment",
        // Always set status to pending for this view
        status: "pending",
        createdAt: amendment.createdAt.toISOString(),
        userName,
        userId,
      }
    })

    return { amendments: processedAmendments }
  } catch (error) {
    console.error("Error fetching recent amendments:", error)
    return { error: "Failed to fetch amendments" }
  }
}

