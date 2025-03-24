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

    // Get monthly stats for charts
    // Get data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get monthly clicks
    const monthlyClicks = await db.affiliateClick.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Get monthly conversions
    const monthlyConversions = await db.affiliateConversion.groupBy({
      by: ["createdAt"],
      _sum: {
        commission: true,
      },
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Get monthly new affiliates
    const monthlyNewAffiliates = await db.affiliateLink.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Format monthly data for charts
    const monthlyStats = []

    // Process the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleString("default", { month: "short" })

      // Find clicks for this month
      const clicksForMonth = monthlyClicks.filter((click) => {
        const clickDate = new Date(click.createdAt)
        return clickDate.getMonth() === date.getMonth() && clickDate.getFullYear() === date.getFullYear()
      })

      const totalClicksForMonth = clicksForMonth.reduce((sum, click) => sum + click._count.id, 0)

      // Find conversions for this month
      const conversionsForMonth = monthlyConversions.filter((conversion) => {
        const conversionDate = new Date(conversion.createdAt)
        return conversionDate.getMonth() === date.getMonth() && conversionDate.getFullYear() === date.getFullYear()
      })

      const totalConversionsForMonth = conversionsForMonth.reduce((sum, conversion) => sum + conversion._count.id, 0)
      const totalCommissionForMonth = conversionsForMonth.reduce(
        (sum, conversion) => sum + Number(conversion._sum.commission || 0),
        0,
      )

      // Find new affiliates for this month
      const newAffiliatesForMonth = monthlyNewAffiliates.filter((affiliate) => {
        const affiliateDate = new Date(affiliate.createdAt)
        return affiliateDate.getMonth() === date.getMonth() && affiliateDate.getFullYear() === date.getFullYear()
      })

      const totalNewAffiliatesForMonth = newAffiliatesForMonth.reduce((sum, affiliate) => sum + affiliate._count.id, 0)

      monthlyStats.push({
        month,
        clicks: totalClicksForMonth,
        conversions: totalConversionsForMonth,
        commission: totalCommissionForMonth,
        newAffiliates: totalNewAffiliatesForMonth,
      })
    }

    // Reverse to get chronological order
    monthlyStats.reverse()

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
      monthlyStats,
    })
  } catch (error) {
    console.error("Error fetching affiliate dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

