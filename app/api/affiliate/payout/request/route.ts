import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AffiliateConversionStatus, AffiliatePayoutStatus } from "@/lib/affiliate-types"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { method } = await req.json()

    if (!method) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 })
    }

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "No affiliate account found" }, { status: 404 })
    }

    // Calculate available balance
    const conversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: AffiliateConversionStatus.APPROVED,
      },
    })

    const availableBalance = conversions.reduce((sum, c) => sum + Number(c.commission), 0)

    // Get minimum payout amount
    const settings = (await db.affiliateSettings.findFirst()) || { minPayoutAmount: 50 }

    if (availableBalance < Number(settings.minPayoutAmount)) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is $${settings.minPayoutAmount}`,
        },
        { status: 400 },
      )
    }

    // Create payout request
    const payout = await db.affiliatePayout.create({
      data: {
        userId: session.user.id,
        amount: availableBalance,
        method,
        status: AffiliatePayoutStatus.PENDING,
      },
    })

    // Update conversions to PAID status using raw SQL
    await db.$executeRaw`
      UPDATE affiliate_conversions 
      SET status = ${AffiliateConversionStatus.PAID}, updatedAt = NOW() 
      WHERE linkId = ${affiliateLink.id} AND status = ${AffiliateConversionStatus.APPROVED}
    `

    return NextResponse.json({ payout })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}

