import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Only allow admins or the user themselves to access user details
    if ((session.user as any).role !== Role.ADMIN && (session.user as any).id !== id) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Fetch user with detailed information
    const user = await prisma.user.findUnique({
      where: { id },
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

    // Add virtual fields for subscription info
    const userWithSubscription = {
      ...user,
      status: "Active", // Virtual field
      company: "N/A", // Virtual field
      phone: "N/A", // Virtual field
      address: "N/A", // Virtual field
      subscription: {
        plan: "None",
        status: "Inactive",
      },
      // Add empty arrays for documents and activities
      documents: [],
      activities: [],
      notes: "",
      lastActive: "Never",
      profileImage: user.image,
    }

    return NextResponse.json({ user: userWithSubscription })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Only allow admins or the user themselves to update user details
    if ((session.user as any).role !== Role.ADMIN && (session.user as any).id !== id) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        // Only include fields that exist in the User model
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to access this endpoint" }, { status: 401 })
    }

    // Only allow admins to delete users
    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "You don't have permission to access this resource" }, { status: 403 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

