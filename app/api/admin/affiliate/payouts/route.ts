import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    // Get payouts
    const payouts = await db.affiliatePayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    // Get users separately
    const userIds = payouts.map((p) => p.userId)
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Create a map of users by ID for quick lookup
    const userMap = users.reduce(
      (map, user) => {
        map[user.id] = user
        return map
      },
      {} as Record<string, any>,
    )

    // Combine payouts with user data
    const payoutsWithUsers = payouts.map((payout) => ({
      ...payout,
      user: userMap[payout.userId] || null,
    }))

    // Get total count using a separate query
    const totalCount = await db.affiliatePayout.findMany({
      where,
      select: { id: true },
    })
    const total = totalCount.length

    return NextResponse.json({
      payouts: payoutsWithUsers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching affiliate payouts:", error)
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
  }
}

