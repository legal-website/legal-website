import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Skip check for admin and support users
    if (user.role === "ADMIN" || user.role === "SUPPORT") {
      return NextResponse.json({
        personalDetails: {
          isRedirectDisabled: true,
          status: "approved",
        },
      })
    }

    // Find personal details for the user
    const personalDetails = await db.personalDetails.findFirst({
      where: { userId: user.id },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error checking personal details status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

