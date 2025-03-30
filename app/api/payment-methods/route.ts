import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type")

    // Build the where clause based on filters
    const where: any = {
      isActive: true, // Only return active payment methods for clients
    }

    if (type) {
      where.type = type
    }

    // Fetch payment methods from database
    const paymentMethods = await db.paymentMethod.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ paymentMethods })
  } catch (error: any) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

