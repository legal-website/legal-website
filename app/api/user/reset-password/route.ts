import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()

    if (!body.password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Store the password directly without hashing
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: body.password, // Store password as plaintext
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

