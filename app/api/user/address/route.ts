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
    console.log("Fetching address for user ID:", userId)

    // Find the user's address
    const address = await db.userAddress.findUnique({
      where: { userId },
    })

    console.log("Address found:", address)

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error fetching user address:", error)
    return NextResponse.json({ error: "Failed to fetch user address" }, { status: 500 })
  }
}

