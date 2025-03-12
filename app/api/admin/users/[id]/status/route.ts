import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
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
    const validStatuses = ["Active", "Pending", "Inactive", "Suspended"]
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Since status is a virtual field, we'll just return success
    // In a real app, you would store this in a separate table or add the field to the User model

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        status: body.status,
      },
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
  }
}

