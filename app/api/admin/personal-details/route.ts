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
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "15")

    // Ensure valid pagination parameters
    const validPage = page > 0 ? page : 1
    const validLimit = limit > 0 && limit <= 100 ? limit : 15
    const skip = (validPage - 1) * validLimit

    // Build where clause based on status
    const where = status !== "all" ? { status } : {}

    // Get total count for pagination
    const totalItems = await db.personalDetails.count({ where })
    const totalPages = Math.ceil(totalItems / validLimit)

    // Get paginated personal details
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
      skip,
      take: validLimit,
    })

    return NextResponse.json({
      personalDetails,
      totalItems,
      totalPages,
      currentPage: validPage,
    })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

