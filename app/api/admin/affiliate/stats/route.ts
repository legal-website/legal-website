import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tables exist first
    const tablesExist = await db.$queryRaw`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_links') as links_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_conversions') as conversions_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_clicks') as clicks_exist
    `

    const { links_exist, conversions_exist, clicks_exist } = (tablesExist as any)[0]

    // If tables don't exist, return empty stats
    if (!links_exist || !conversions_exist || !clicks_exist) {
      return NextResponse.json({
        success: true,
        stats: {
          totalLinks: 0,
          totalClicks: 0,
          totalConversions: 0,
          conversionRate: 0,
          totalCommission: 0,
          recentClicks: [],
          recentConversions: [],
          topAffiliates: [],
        },
        tablesExist: {
          affiliate_links: links_exist === 1,
          affiliate_conversions: conversions_exist === 1,
          affiliate_clicks: clicks_exist === 1,
        },
      })
    }

    // Get total links
    const totalLinksResult = await db.$queryRaw`
      SELECT COUNT(*) as count FROM affiliate_links
    `
    const totalLinks = (totalLinksResult as any)[0].count

    // Get total clicks
    const totalClicksResult = await db.$queryRaw`
      SELECT COUNT(*) as count FROM affiliate_clicks
    `
    const totalClicks = (totalClicksResult as any)[0].count

    // Get total conversions
    const totalConversionsResult = await db.$queryRaw`
      SELECT COUNT(*) as count FROM affiliate_conversions
    `
    const totalConversions = (totalConversionsResult as any)[0].count

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Get total commission
    const totalCommissionResult = await db.$queryRaw`
      SELECT SUM(commission) as total FROM affiliate_conversions
    `
    const totalCommission = (totalCommissionResult as any)[0].total || 0

    // Get recent clicks (last 10)
    const recentClicks = await db.$queryRaw`
      SELECT 
        ac.id, 
        ac.createdAt, 
        ac.ip, 
        ac.userAgent,
        al.code as affiliateCode,
        u.email as affiliateEmail
      FROM affiliate_clicks ac
      JOIN affiliate_links al ON ac.linkId = al.id
      JOIN users u ON al.userId = u.id
      ORDER BY ac.createdAt DESC
      LIMIT 10
    `

    // Get recent conversions (last 10)
    const recentConversions = await db.$queryRaw`
      SELECT 
        ac.id, 
        ac.createdAt, 
        ac.amount,
        ac.commission,
        ac.status,
        ac.customerEmail,
        al.code as affiliateCode,
        u.email as affiliateEmail
      FROM affiliate_conversions ac
      JOIN affiliate_links al ON ac.linkId = al.id
      JOIN users u ON al.userId = u.id
      ORDER BY ac.createdAt DESC
      LIMIT 10
    `

    // Get top affiliates by commission
    const topAffiliates = await db.$queryRaw`
      SELECT 
        u.id as userId,
        u.email as email,
        COUNT(DISTINCT ac.id) as conversions,
        SUM(ac.commission) as totalCommission
      FROM users u
      JOIN affiliate_links al ON u.id = al.userId
      JOIN affiliate_conversions ac ON al.id = ac.linkId
      GROUP BY u.id, u.email
      ORDER BY totalCommission DESC
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      stats: {
        totalLinks,
        totalClicks,
        totalConversions,
        conversionRate: Number.parseFloat(conversionRate.toFixed(2)),
        totalCommission: Number.parseFloat(totalCommission.toString()),
        recentClicks,
        recentConversions,
        topAffiliates,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_STATS_ERROR]", error)
    return NextResponse.json(
      {
        error: "Failed to fetch affiliate stats",
        details: error,
        message: "Please make sure all affiliate tables exist by visiting /api/admin/affiliate/fix-schema",
      },
      { status: 500 },
    )
  }
}

