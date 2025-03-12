import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Only allow admins to update user status
    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Validate status
    const validStatuses = ["Active", "Pending", "Inactive", "Suspended", "Validation Email Sent"]
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the user to verify they exist
    const user = await db.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update emailVerified field based on status
    let emailVerified = user.emailVerified

    if (body.status === "Active" && !user.emailVerified) {
      emailVerified = new Date()
    } else if (body.status !== "Active" && user.emailVerified) {
      emailVerified = null
    }

    // Update the user with the new emailVerified status
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        emailVerified,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        status: body.status, // Return the requested status as a virtual field
      },
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine status based on emailVerified
    let status = "Pending"
    if (user.emailVerified) {
      status = "Active"
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error getting user status:", error)
    return NextResponse.json({ error: "Failed to get user status" }, { status: 500 })
  }
}

