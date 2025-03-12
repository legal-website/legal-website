import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Find the user's business information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        business: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ business: user.business || null })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

