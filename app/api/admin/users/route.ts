import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

// Admin user schema
const adminUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
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

// GET all admin users (super admin only)
export async function GET(req: NextRequest) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Get all admin users
    const users = await prisma.user.findMany({
      where: {
        OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error getting admin users:", error)
    return NextResponse.json(
      {
        error: "Failed to get admin users",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

// POST create a new admin user (super admin only)
export async function POST(req: NextRequest) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()

    // Validate request body
    const validatedData = adminUserSchema.parse(body)

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        role: validatedData.role,
      },
    })

    // Return user without password
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error("Error creating admin user:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to create admin user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

