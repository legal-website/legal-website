import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({
        totalEarnings: 0,
        pendingEarnings: 0,
        totalReferrals: 0,
        totalClicks: 0,
        conversionRate: 0,
        recentEarnings: [],
        recentReferrals: [],
      })
    }

    // Get total clicks
    const totalClicks = await db.$queryRaw`
      SELECT COUNT(*) as count FROM affiliate_clicks WHERE linkId = ${affiliateLink.id}
    `.then((result: any) => Number(result[0].count))

    // Get conversions
    const conversions = await db.affiliateConversion.findMany({
      where: { linkId: affiliateLink.id },
      orderBy: { createdAt: "desc" },
    })

    // Calculate total earnings
    const totalEarnings = conversions
      .filter((c) => c.status === AffiliateConversionStatus.APPROVED || c.status === AffiliateConversionStatus.PAID)
      .reduce((sum, c) => sum + Number(c.commission), 0)

    // Calculate pending earnings
    const pendingEarnings = conversions
      .filter((c) => c.status === AffiliateConversionStatus.PENDING)
      .reduce((sum, c) => sum + Number(c.commission), 0)

    // Get total successful referrals
    const totalReferrals = conversions.filter(
      (c) => c.status === AffiliateConversionStatus.APPROVED || c.status === AffiliateConversionStatus.PAID,
    ).length

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalReferrals / totalClicks) * 100 : 0

    // Get recent earnings (last 5)
    const recentEarnings = conversions
      .filter((c) => c.status === AffiliateConversionStatus.APPROVED || c.status === AffiliateConversionStatus.PAID)
      .slice(0, 5)

    // Get recent referrals with user info
    const recentReferrals = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: {
          in: [AffiliateConversionStatus.APPROVED, AffiliateConversionStatus.PAID, AffiliateConversionStatus.PENDING],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Get payouts
    const payouts = await db.affiliatePayout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // Get affiliate settings
    const settings = (await db.affiliateSettings.findFirst()) || {
      minPayoutAmount: 50,
      commissionRate: 10,
      cookieDuration: 30,
    }

    return NextResponse.json({
      totalEarnings,
      pendingEarnings,
      totalReferrals,
      totalClicks,
      conversionRate,
      recentEarnings,
      recentReferrals,
      payouts,
      settings,
    })
  } catch (error) {
    console.error("Error fetching affiliate stats:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate statistics" }, { status: 500 })
  }
}

