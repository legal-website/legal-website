import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user and check if they are an admin
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPPORT)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build the where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Get total count for pagination
    const totalCount = await db.personalDetails.count({ where })

    // Get personal details with pagination
    const personalDetails = await db.personalDetails.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      personalDetails,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

