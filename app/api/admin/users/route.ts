import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
  try {
    console.log("API: Fetching users")

    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    console.log("API: Session", session ? "exists" : "does not exist")

    if (!session?.user) {
      console.log("API: Unauthorized - No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow admins to access all users
    if ((session.user as any).role !== Role.ADMIN) {
      console.log("API: Forbidden - Not admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch users from database
    console.log("API: Fetching users from database")
    try {
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          image: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`API: Found ${users.length} users`)

      // Format dates and add virtual fields for UI display
      const formattedUsers = users.map((user) => {
        // Format dates for display
        const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })

        // Return formatted user data with virtual fields for UI
        return {
          ...user,
          joinDate,
          lastActive: "N/A", // Virtual field
          company: "N/A", // Virtual field
          status: "Active", // Virtual field
          phone: "N/A", // Virtual field
          address: "N/A", // Virtual field
          profileImage: user.image, // Map image to profileImage
        }
      })

      // Return JSON response
      console.log("API: Returning users")
      return NextResponse.json({
        users: formattedUsers,
        success: true,
        count: formattedUsers.length,
      })
    } catch (dbError) {
      console.error("API: Database error:", dbError)
      return NextResponse.json(
        {
          error: "Database error",
          message: (dbError as Error).message,
          stack: process.env.NODE_ENV === "development" ? (dbError as Error).stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        message: (error as Error).message,
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}

