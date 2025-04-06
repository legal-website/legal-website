import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user address
    const address = await db.userAddress.findUnique({
      where: { userId },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error fetching user address:", error)
    return NextResponse.json({ error: "Failed to fetch user address" }, { status: 500 })
  }
}

