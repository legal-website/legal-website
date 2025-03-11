import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { updateAdminUser, deleteAdminUser } from "@/lib/db/direct-db"
import { z } from "zod"

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

    return (session.user as any).role === "SUPER_ADMIN"
  } catch (error) {
    console.error("Error checking super admin status:", error)
    return false
  }
}

// PUT/PATCH update an admin user (super admin only)
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

    // Update admin user
    const user = await updateAdminUser(params.id, validatedData)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating admin user:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update admin user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

// DELETE an admin user (super admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(req)
    if (!superAdmin) {
      return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 403 })
    }

    // Delete admin user
    const success = await deleteAdminUser(params.id)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete admin user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return NextResponse.json(
      {
        error: "Failed to delete admin user",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

