import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id

    // Get user from database with only fields that exist in the User model
    const user = await db.user.findUnique({
      where: { id: userId },
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
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Format the user data for the frontend with virtual fields for UI
    const formattedUser = {
      id: user.id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      status: "Active", // Virtual field
      company: "N/A", // Virtual field
      phone: "N/A", // Virtual field
      address: "N/A", // Virtual field
      joinDate: new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      lastActive: "Never", // Virtual field
      profileImage: user.image || null,
      subscriptionPlan: "None", // Virtual field
      subscriptionStatus: "Inactive", // Virtual field
      notes: "", // Virtual field
      documents: [], // Virtual field
      activity: [], // Virtual field
    }

    return NextResponse.json({
      success: true,
      user: formattedUser,
    })
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching the user",
      },
      { status: 500 },
    )
  }
}

// Update user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id
    const data = await req.json()

    // Validate the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user in database with only fields that exist in the User model
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        // Only include fields that exist in the User model
      },
    })

    // Log the activity
    console.log(`User ${userId} updated by admin ${session.user.id}`)

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while updating the user",
      },
      { status: 500 },
    )
  }
}

// Delete user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id

    // Validate the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user from database
    await db.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while deleting the user",
      },
      { status: 500 },
    )
  }
}

