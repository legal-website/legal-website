import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Only allow admins to access all users
    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Get URL parameters for filtering
    const url = new URL(request.url)
    const role = url.searchParams.get("role")
    const search = url.searchParams.get("search")

    // Build the query
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

    // Fetch users from database
    const users = await prisma.user.findMany(query)

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

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

