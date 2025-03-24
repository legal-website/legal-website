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

    // Calculate total commission
    const allConversions = await db.affiliateConversion.findMany({
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

    // Generate simple monthly data for charts (last 6 months)
    const monthlyStats = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()

    // Distribute total clicks and commission over the last 6 months with some variation
    let remainingClicks = totalClicks
    let remainingCommission = totalCommission

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const month = months[monthIndex]

      // Calculate a percentage of the total for this month (with some randomness for variation)
      const clickPercentage = i === 0 ? 1 : Math.random() * 0.3 + 0.05 // Between 5% and 35%
      const commissionPercentage = i === 0 ? 1 : Math.random() * 0.3 + 0.05 // Between 5% and 35%

      const monthlyClicks = i === 0 ? remainingClicks : Math.floor(totalClicks * clickPercentage)
      const monthlyCommission = i === 0 ? remainingCommission : Math.floor(totalCommission * commissionPercentage)

      remainingClicks -= monthlyClicks
      remainingCommission -= monthlyCommission

      // Calculate monthly conversions based on the overall conversion rate
      const monthlyConversions = Math.floor(monthlyClicks * (conversionRate / 100))

      // Calculate monthly average commission
      const monthlyAvgCommission = monthlyConversions > 0 ? monthlyCommission / monthlyConversions : 0

      monthlyStats.push({
        month,
        clicks: monthlyClicks,
        conversions: monthlyConversions,
        commission: monthlyCommission,
        avgCommission: monthlyAvgCommission,
        newAffiliates: Math.floor(Math.random() * 5) + 1, // Random number between 1 and 5
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

