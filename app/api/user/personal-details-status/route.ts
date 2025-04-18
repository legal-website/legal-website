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
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find personal details for the user
    const personalDetails = await db.personalDetails.findFirst({
      where: { userId: user.id },
    })

    return NextResponse.json({
      personalDetails: personalDetails
        ? {
            id: personalDetails.id,
            status: personalDetails.status,
            isRedirectDisabled: personalDetails.isRedirectDisabled,
            createdAt: personalDetails.createdAt,
            updatedAt: personalDetails.updatedAt,
          }
        : null,
    })
  } catch (error) {
    console.error("Error checking personal details status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

