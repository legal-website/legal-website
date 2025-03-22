import { NextResponse } from "next/server"
import { recordAffiliateClick } from "@/lib/affiliate-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const redirect = searchParams.get("redirect") || "/"

    if (!code) {
      return NextResponse.json({ error: "Affiliate code is required" }, { status: 400 })
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Record the click
    await recordAffiliateClick(code, ip as string, userAgent)

    // Set the cookie
    const response = NextResponse.redirect(new URL(redirect, request.url))
    response.cookies.set("affiliate_code", code, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("[AFFILIATE_CLICK_ERROR]", error)
    return NextResponse.json({ error: "Failed to process affiliate click" }, { status: 500 })
  }
}

