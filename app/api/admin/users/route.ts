import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get URL parameters for filtering
    const url = new URL(req.url)
    const role = url.searchParams.get("role")
    const search = url.searchParams.get("search")

    // Build the query with only fields that exist in the User model
    const query: any = {
      where: {},
      orderBy: {
        createdAt: "desc",
      },
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
    }

    // Add filters if provided
    if (role && role !== "All Roles") {
      query.where.role = role
    }

    if (search) {
      query.where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get users from database
    const users = await db.user.findMany(query)

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

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching users",
      },
      { status: 500 },
    )
  }
}

