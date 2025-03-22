import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const affiliates = await db.affiliateLink.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            clicks: true,
            conversions: true,
          },
        },
      },
    })

    // Get earnings for each affiliate
    const affiliatesWithEarnings = await Promise.all(
      affiliates.map(async (affiliate) => {
        const conversions = await db.affiliateConversion.findMany({
          where: {
            linkId: affiliate.id,
            status: {
              in: ["APPROVED", "PAID"],
            },
          },
        })

        const earnings = conversions.reduce((sum, c) => sum + Number(c.commission), 0)

        return {
          ...affiliate,
          earnings,
        }
      }),
    )

    const total = await db.affiliateLink.count()

    return NextResponse.json({
      affiliates: affiliatesWithEarnings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching affiliates:", error)
    return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 })
  }
}

