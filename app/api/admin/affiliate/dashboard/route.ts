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

    // Get all affiliate links with the filter
    const affiliateLinks = await db.affiliateLink.findMany({
      where: {},
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

    // Get all conversions with the filter
    const conversions = await db.affiliateConversion.findMany({
      where: {},
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

    // Get all payouts with the filter
    const payouts = await db.affiliatePayout.findMany({
      where: {},
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

    // Calculate total stats with the filter
    const totalClicks = await db.affiliateClick.count({
      where: {},
    })

    const totalConversions = await db.affiliateConversion.count({
      where: {},
    })

    const totalPendingConversions = await db.affiliateConversion.count({
      where: {
        status: "PENDING",
      },
    })

    // Calculate total commission with the filter
    const allConversions = await db.affiliateConversion.findMany({
      where: {},
      select: {
        commission: true,
        amount: true,
      },
    })

    const totalCommission = allConversions.reduce((sum, conversion) => sum + Number(conversion.commission || 0), 0)
    const totalAmount = allConversions.reduce((sum, conversion) => sum + Number(conversion.amount || 0), 0)

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Calculate average commission
    const avgCommission = totalConversions > 0 ? totalCommission / totalConversions : 0

    // Get actual affiliate growth data with the filter
    // For simplicity, we'll get the count of affiliates created in each month
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const affiliatesByMonth = await db.affiliateLink.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Get actual click data by month with the filter
    const clicksByMonth = await db.affiliateClick.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Get actual conversion data by month with the filter
    const conversionsByMonth = await db.affiliateConversion.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        commission: true,
      },
    })

    // Generate monthly stats based on actual data
    const monthlyStats = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()

    // Initialize cumulative affiliates count
    let cumulativeAffiliates = await db.affiliateLink.count({
      where: {
        createdAt: {
          lt: sixMonthsAgo,
        },
      },
    })

    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      const month = months[monthIndex]

      const monthStart = new Date()
      monthStart.setMonth(currentMonth - 5 + i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date()
      monthEnd.setMonth(currentMonth - 5 + i + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      // Count new affiliates for this month
      const newAffiliatesThisMonth = affiliatesByMonth.filter((a) => {
        const date = new Date(a.createdAt)
        return date >= monthStart && date <= monthEnd
      }).length

      // Add to cumulative total
      cumulativeAffiliates += newAffiliatesThisMonth

      // Count clicks for this month
      const clicksThisMonth = clicksByMonth.filter((c) => {
        const date = new Date(c.createdAt)
        return date >= monthStart && date <= monthEnd
      }).length

      // Count conversions and commission for this month
      const conversionsThisMonth = conversionsByMonth.filter((c) => {
        const date = new Date(c.createdAt)
        return date >= monthStart && date <= monthEnd
      })

      const conversionsCount = conversionsThisMonth.length
      const commissionThisMonth = conversionsThisMonth.reduce((sum, c) => sum + Number(c.commission || 0), 0)

      // Calculate average commission for this month
      const avgCommissionThisMonth = conversionsCount > 0 ? commissionThisMonth / conversionsCount : 0

      monthlyStats.push({
        month,
        clicks: clicksThisMonth,
        conversions: conversionsCount,
        commission: commissionThisMonth,
        avgCommission: avgCommissionThisMonth,
        newAffiliates: newAffiliatesThisMonth,
        totalAffiliates: cumulativeAffiliates,
      })
    }

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
        totalCommission,
        totalAmount,
        avgCommission,
        conversionRate,
      },
      monthlyStats,
    })
  } catch (error) {
    console.error("Error fetching affiliate dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

