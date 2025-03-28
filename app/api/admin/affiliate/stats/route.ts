import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total affiliates
    const totalAffiliates = await db.affiliateLink.count()

    // Get total clicks
    const totalClicks = await db.affiliateClick.count()

    // Get total conversions
    const totalConversions = await db.affiliateConversion.count()

    // Get approved conversions
    const approvedConversions = await db.affiliateConversion.count({
      where: {
        status: {
          in: ["APPROVED", "PAID"],
        },
      },
    })

    // Calculate total commission
    const conversions = await db.affiliateConversion.findMany({
      where: {
        status: {
          in: ["APPROVED", "PAID"],
        },
      },
    })

    const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commission), 0)

    // Get pending payouts - using findMany and calculating length
    const pendingPayoutsArray = await db.affiliatePayout.findMany({
      where: { status: "PENDING" },
    })
    const pendingPayouts = pendingPayoutsArray.length

    // Calculate pending payout amount
    const pendingPayoutAmount = pendingPayoutsArray.reduce((sum, p) => sum + Number(p.amount), 0)

    // Get conversion rate
    const conversionRate = totalClicks > 0 ? (approvedConversions / totalClicks) * 100 : 0

    // Get recent conversions
    const recentConversions = await db.affiliateConversion.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
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
    })

    return NextResponse.json({
      totalAffiliates,
      totalClicks,
      totalConversions,
      approvedConversions,
      totalCommission,
      pendingPayouts,
      pendingPayoutAmount,
      conversionRate,
      recentConversions,
    })
  } catch (error) {
    console.error("Error fetching affiliate stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

