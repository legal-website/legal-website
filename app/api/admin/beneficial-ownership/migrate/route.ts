import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    // Ensure only admins can run this migration
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    console.log(`Found ${users.length} total users to check for beneficial ownership records`)

    // Statistics for the response
    const stats = {
      totalUsers: users.length,
      usersWithExistingRecords: 0,
      usersWithNewRecords: 0,
      failedUsers: 0,
      errors: [] as { userId: string; error: string }[],
    }

    // Process each user
    for (const user of users) {
      try {
        // Check if user already has a default beneficial owner record
        const existingRecord = await db.beneficialOwner.findFirst({
          where: {
            userId: user.id,
            isDefault: true,
          },
        })

        if (existingRecord) {
          // User already has a default record
          stats.usersWithExistingRecords++
          continue
        }

        // Create a default beneficial owner record for this user
        await db.beneficialOwner.create({
          data: {
            userId: user.id,
            name: user.name || "Primary Owner",
            title: "CEO",
            ownershipPercentage: 100,
            status: "reported",
            isDefault: true,
            updatedAt: new Date(),
          },
        })

        stats.usersWithNewRecords++
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        stats.failedUsers++
        stats.errors.push({
          userId: user.id,
          error: (error as Error).message,
        })
      }
    }

    // Return statistics about the migration
    return NextResponse.json({
      success: true,
      message: "Beneficial ownership migration completed",
      stats,
    })
  } catch (error) {
    console.error("Error in beneficial ownership migration:", error)
    return NextResponse.json(
      { error: "Failed to run beneficial ownership migration", details: (error as Error).message },
      { status: 500 },
    )
  }
}

