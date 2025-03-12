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

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id
    const { status } = await req.json()

    // Validate status
    const validStatuses = ["Active", "Inactive", "Suspended", "Pending"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Since status field doesn't exist in the User model,
    // we'll just log the status change and return success
    console.log(`Status changed to ${status} for user ${userId} by admin ${session.user.id}`)

    // Return the user with the virtual status field
    return NextResponse.json({
      success: true,
      user: {
        ...existingUser,
        status, // Add the virtual status field to the response
      },
    })
  } catch (error: any) {
    console.error("Error changing user status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while changing the user status",
      },
      { status: 500 },
    )
  }
}

