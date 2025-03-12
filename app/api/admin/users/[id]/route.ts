import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Modify the user query to include sessions with proper ordering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: true,
        sessions: {
          orderBy: {
            createdAt: "desc", // Order by creation time
          },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Use the most recent session's creation time as the last active time
    const lastActive =
      user.sessions && user.sessions.length > 0
        ? user.sessions[0].createdAt // Use createdAt for last active time
        : user?.updatedAt || user?.createdAt

    // Format user data
    const formattedUser = {
      ...user,
      lastActive,
      // Don't expose password
      password: undefined,
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// Rest of the file remains the same
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const data = await req.json()

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        // Update business if it exists
        business: data.company
          ? {
              upsert: {
                create: {
                  name: data.company,
                  phone: data.phone,
                  address: data.address,
                },
                update: {
                  name: data.company,
                  phone: data.phone,
                  address: data.address,
                },
              },
            }
          : undefined,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

