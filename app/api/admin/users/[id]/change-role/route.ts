import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN can change roles
    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden. Only Admins can change user roles." }, { status: 403 })
    }

    const userId = params.id
    const { role } = await req.json()

    // Validate role using the actual Role enum values
    const validRoles = Object.values(Role)
    if (!validRoles.includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Validate the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user role in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: role as Role,
      },
    })

    // Log the activity
    console.log(`Role changed to ${role} for user ${userId} by admin ${session.user.id}`)

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("Error changing user role:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while changing the user role",
      },
      { status: 500 },
    )
  }
}

