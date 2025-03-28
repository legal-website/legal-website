import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or support
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get status filter from query params
    const url = new URL(req.url)
    const status = url.searchParams.get("status") || "all"

    // Build where clause based on status
    const where = status !== "all" ? { status } : {}

    // Get all personal details
    const personalDetails = await db.personalDetails.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

