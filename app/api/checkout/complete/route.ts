import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json()

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Order ID and amount are required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Get the affiliate cookie directly from the request headers
    const cookieHeader = req.headers.get("cookie") || ""
    const affiliateCookie = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("affiliate="))
      ?.split("=")[1]

    if (!affiliateCookie) {
      return NextResponse.json({ success: true, affiliateTracked: false })
    }

    const refCode = affiliateCookie

    // Find the affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { code: refCode },
    })

    if (!affiliateLink) {
      return NextResponse.json({ success: true, affiliateTracked: false })
    }

    // Don't record if the affiliate is the same as the user making the purchase
    if (userId && affiliateLink.userId === userId) {
      return NextResponse.json({ success: true, affiliateTracked: false })
    }

    // Get commission rate from settings
    const settings = (await db.affiliateSettings.findFirst()) || { commissionRate: 10 }

    // Calculate commission
    const commission = (amount * Number(settings.commissionRate)) / 100

    // Record the conversion
    await db.affiliateConversion.create({
      data: {
        linkId: affiliateLink.id,
        orderId,
        amount,
        commission,
        status: AffiliateConversionStatus.PENDING,
      },
    })

    return NextResponse.json({ success: true, affiliateTracked: true })
  } catch (error) {
    console.error("Error recording affiliate conversion:", error)
    return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 })
  }
}

