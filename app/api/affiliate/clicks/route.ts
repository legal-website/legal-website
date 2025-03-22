import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { code, referrer, userAgent, ipAddress } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Affiliate code is required" }, { status: 400 })
    }

    // Find the affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { code },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 400 })
    }

    // Record the click
    await db.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress,
        userAgent,
        referrer,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording affiliate click:", error)
    return NextResponse.json({ error: "Failed to record click" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user's affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ clicks: [] })
    }

    // Get the clicks
    const clicks = await db.affiliateClick.findMany({
      where: { linkId: affiliateLink.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ clicks })
  } catch (error) {
    console.error("Error fetching affiliate clicks:", error)
    return NextResponse.json({ error: "Failed to fetch clicks" }, { status: 500 })
  }
}

