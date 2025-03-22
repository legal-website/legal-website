import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist
    const tableCheck = await fetch(new URL("/api/admin/affiliate/check-tables", process.env.NEXT_PUBLIC_APP_URL)).then(
      (res) => res.json(),
    )

    if (!tableCheck.success || !tableCheck.tables.affiliate_links || !tableCheck.tables.affiliate_conversions) {
      return NextResponse.json({
        error: "Affiliate tables don't exist",
        tableStatus: tableCheck.tables,
        solution: "Call /api/admin/affiliate/create-tables first",
      })
    }

    // Try to query the tables
    const linkCount = await db.affiliateLink.count()
    const clickCount = await db.affiliateClick.count()
    const conversionCount = await db.affiliateConversion.count()

    return NextResponse.json({
      success: true,
      counts: {
        links: linkCount,
        clicks: clickCount,
        conversions: conversionCount,
      },
      message: "Affiliate system is working correctly",
    })
  } catch (error) {
    console.error("[AFFILIATE_TEST]", error)
    return NextResponse.json({ error: "Test failed", details: error }, { status: 500 })
  }
}

