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

    // Only allow admins to update user roles
    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Validate role
    const validRoles = Object.values(Role)
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: body.role,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}

