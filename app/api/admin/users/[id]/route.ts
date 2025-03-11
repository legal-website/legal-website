import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

// Admin user update schema
const adminUserUpdateSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
})

// Helper function to check if user is super admin
async function isSuperAdmin(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return false
    }

    return session.user.role === "SUPER_ADMIN"
  } catch (error) {
    console.error("Error checking super admin status:", error)
    return false
  }
}

// GET a specific user (super admin only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error getting user:", error)
    return NextResponse.json(
      {
        error: "Failed to get user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

// PUT/PATCH update a user (super admin only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()

    // Validate request body
    const validatedData = adminUserUpdateSchema.parse(body)

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

// DELETE a user (super admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        error: "Failed to delete user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

