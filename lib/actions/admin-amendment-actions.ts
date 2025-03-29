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
    // Fetch amendments with minimal includes to avoid type errors
    // @ts-ignore - Prisma client type issue
    const amendments = await db.amendment.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Process amendments to ensure consistent format, using optional chaining
    // to safely access properties that might not exist
    const processedAmendments = amendments.map((amendment: any) => {
      // Extract business name from various possible locations in the data structure
      const businessName =
        amendment.businessName || amendment.business?.name || amendment.client?.name || "Unknown Business"

      // Extract business ID from various possible locations
      const businessId = amendment.businessId || amendment.business?.id || amendment.client?.id || "unknown-business"

      // Try to find an amount field
      const amount =
        typeof amendment.amount === "number"
          ? amendment.amount
          : typeof amendment.fee === "number"
            ? amendment.fee
            : typeof amendment.cost === "number"
              ? amendment.cost
              : 0

      return {
        id: amendment.id,
        // Use type as title if it exists, otherwise use a default
        title: amendment.title || amendment.type || amendment.name || "Amendment",
        // Use status if it exists, otherwise default to pending
        status: amendment.status || "pending",
        amount,
        createdAt: amendment.createdAt.toISOString(),
        businessName,
        businessId,
      }
    })

    return { amendments: processedAmendments }
  } catch (error) {
    console.error("Error fetching recent amendments:", error)
    return { error: "Failed to fetch amendments" }
  }
}

