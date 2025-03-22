import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all affiliate links
    const affiliateLinks = await db.affiliateLink.findMany({
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

    // Get all conversions
    const conversions = await db.affiliateConversion.findMany({
      include: {
        link: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get all payouts
    const payouts = await db.affiliatePayout.findMany({
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
        createdAt: "desc",
      },
    })

    // Get affiliate settings
    const settings = (await db.affiliateSettings.findFirst()) || {
      commissionRate: 10,
      minPayoutAmount: 50,
      cookieDuration: 30,
    }

    // Calculate total stats
    const totalClicks = await db.affiliateClick.count()
    const totalConversions = await db.affiliateConversion.count()
    const totalPendingConversions = await db.affiliateConversion.count({
      where: { status: "PENDING" },
    })

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return NextResponse.json({
      affiliateLinks,
      conversions,
      payouts,
      settings,
      stats: {
        totalAffiliates: affiliateLinks.length,
        totalClicks,
        totalConversions,
        totalPendingConversions,
        conversionRate,
      },
    })
  } catch (error) {
    console.error("Error fetching affiliate dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

