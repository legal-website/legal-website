import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Get affiliate settings
    const settings = await db.affiliateSettings.findFirst({
      orderBy: {
        id: "desc",
      },
    })

    // Get total clicks
    const totalClicks = await db.affiliateClick.count({
      where: {
        linkId: affiliateLink.id,
      },
    })

    // Get all conversions
    const allConversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get recent conversions with more details
    const recentConversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    // Get pending payouts
    const pendingPayouts = await db.affiliatePayout.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    })

    // Get all payouts
    const payouts = await db.affiliatePayout.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get rejected payouts
    const rejectedPayouts = await db.affiliatePayout.findMany({
      where: {
        userId: session.user.id,
        status: "REJECTED",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate total earnings (excluding REJECTED conversions)
    const totalEarnings = allConversions
      .filter((conversion) => conversion.status !== "REJECTED")
      .reduce((sum, conversion) => sum + Number(conversion.commission), 0)

    // Calculate pending earnings (only PENDING and APPROVED conversions)
    const pendingEarnings = allConversions
      .filter((conversion) => ["PENDING", "APPROVED"].includes(conversion.status))
      .reduce((sum, conversion) => sum + Number(conversion.commission), 0)

    // Calculate total referrals (only count APPROVED and PAID conversions)
    const totalReferrals = allConversions.filter((conversion) =>
      ["APPROVED", "PAID"].includes(conversion.status),
    ).length

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalReferrals / totalClicks) * 100 : 0

    return NextResponse.json({
      totalClicks,
      totalReferrals,
      totalEarnings,
      pendingEarnings,
      conversionRate,
      recentConversions,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutAmount: pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount), 0),
      payouts,
      rejectedPayouts,
      settings,
    })
  } catch (error) {
    console.error("Error fetching affiliate stats:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate stats" }, { status: 500 })
  }
}

