import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// This middleware tracks affiliate link clicks
export async function trackAffiliateClick(req: NextRequest) {
  try {
    const refCode = req.nextUrl.searchParams.get("ref")

    if (!refCode) {
      return NextResponse.next()
    }

    // Find the affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { code: refCode },
    })

    if (!affiliateLink) {
      return NextResponse.next()
    }

    // Record the click
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"
    const referrer = req.headers.get("referer") || null

    await db.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress,
        userAgent,
        referrer,
      },
    })

    // Set a cookie to track the affiliate
    const response = NextResponse.next()

    // Get cookie duration from settings
    const settings = (await db.affiliateSettings.findFirst()) || { cookieDuration: 30 }

    // Set cookie to expire in X days
    const expires = new Date()
    expires.setDate(expires.getDate() + settings.cookieDuration)

    response.cookies.set({
      name: "affiliate",
      value: refCode,
      expires,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return NextResponse.next()
  }
}

