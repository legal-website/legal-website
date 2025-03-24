import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the affiliate link for the current user
    const affiliateLink = await db.affiliateLink.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        clicks: true,
        conversions: true,
      },
    })

    if (!affiliateLink) {
      return NextResponse.json({
        success: true,
        totalEarnings: 0,
        pendingEarnings: 0,
        totalReferrals: 0,
        totalClicks: 0,
        conversionRate: 0,
        recentEarnings: [],
        recentReferrals: [],
        payouts: [],
      })
    }

    // Get affiliate settings
    const settings = await db.affiliateSettings.findFirst()

    // Get all conversions for this affiliate link
    const conversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get all clicks for this affiliate link
    const clicks = await db.affiliateClick.findMany({
      where: {
        linkId: affiliateLink.id,
      },
    })

    // Get all payouts for this user
    const payouts = await db.affiliatePayout.findMany({
      where: {
        userId: affiliateLink.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate total earnings (approved + paid conversions)
    const totalEarnings = conversions
      .filter((conv) => conv.status === "APPROVED" || conv.status === "PAID")
      .reduce((sum, conv) => sum + Number(conv.commission), 0)

    // Calculate pending earnings (approved conversions)
    const pendingEarnings = conversions
      .filter((conv) => conv.status === "APPROVED")
      .reduce((sum, conv) => sum + Number(conv.commission), 0)

    // Calculate total referrals (all conversions)
    const totalReferrals = conversions.length

    // Calculate conversion rate
    const totalClicks = clicks.length
    const conversionRate = totalClicks > 0 ? (totalReferrals / totalClicks) * 100 : 0

    // Get recent earnings (last 10)
    const recentEarnings = conversions.slice(0, 10)

    // Get recent referrals (last 10)
    const recentReferrals = conversions.slice(0, 10)

    return NextResponse.json({
      success: true,
      totalEarnings,
      pendingEarnings,
      totalReferrals,
      totalClicks,
      conversionRate,
      recentEarnings: recentEarnings.map((earning) => ({
        ...earning,
        amount: Number.parseFloat(earning.amount.toString()),
        commission: Number.parseFloat(earning.commission.toString()),
      })),
      recentReferrals: recentReferrals.map((referral) => ({
        ...referral,
        amount: Number.parseFloat(referral.amount.toString()),
        commission: Number.parseFloat(referral.commission.toString()),
      })),
      payouts: payouts.map((payout) => ({
        ...payout,
        amount: Number.parseFloat(payout.amount.toString()),
      })),
      settings: settings
        ? {
            commissionRate: Number.parseFloat(settings.commissionRate.toString()),
            minPayoutAmount: Number.parseFloat(settings.minPayoutAmount.toString()),
            cookieDuration: settings.cookieDuration,
          }
        : {
            commissionRate: 10,
            minPayoutAmount: 50,
            cookieDuration: 30,
          },
    })
  } catch (error: any) {
    console.error("Error fetching affiliate stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats", message: error.message }, { status: 500 })
  }
}

