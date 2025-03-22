import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function trackAffiliateClick(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const ref = url.searchParams.get("ref")

    if (!ref) {
      return null
    }

    // Find the affiliate link
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: { code: ref },
    })

    if (!affiliateLink) {
      return null
    }

    // Get IP address from headers
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    // Record the click
    await prisma.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || null,
        referrer: req.headers.get("referer") || null,
      },
    })

    // Create a response that sets a cookie and redirects to the same URL without the ref parameter
    const response = NextResponse.redirect(url)

    // Set the affiliate cookie
    response.cookies.set("affiliate", ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return null
  }
}

