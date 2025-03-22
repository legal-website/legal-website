import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const redirect = url.searchParams.get("redirect") || "/"

    console.log(`Affiliate click: code=${code}, redirect=${redirect}`)

    if (!code) {
      console.error("No affiliate code provided")
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    // Find the affiliate link
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: { code },
      include: { user: true },
    })

    if (!affiliateLink) {
      console.error(`Invalid affiliate code: ${code}`)
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    console.log(`Valid affiliate click for user: ${affiliateLink.user.email}`)

    // Record the click
    await prisma.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    })

    // Set the cookie with a long expiration (30 days)
    const cookieStore = await cookies()
    cookieStore.set({
      name: "affiliate",
      value: code,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    console.log(`Set affiliate cookie: ${code} with 30-day expiration`)

    // Redirect to the target URL
    return NextResponse.redirect(new URL(redirect, req.url))
  } catch (error: any) {
    console.error("Error processing affiliate click:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

