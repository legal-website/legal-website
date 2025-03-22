import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AffiliateLinkWithCommission, AffiliateConversionWithRelations } from "@/lib/affiliate-types"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get database type and version
    const dbInfo = await db.$queryRaw`SELECT VERSION() as version`

    // Check if tables exist
    const tablesExist = await db.$queryRaw`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_links') as links_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_conversions') as conversions_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_clicks') as clicks_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_settings') as settings_exist
    `

    // Get counts
    let linkCount = 0
    let conversionCount = 0
    let clickCount = 0

    if ((tablesExist as any)[0].links_exist === 1) {
      const linkCountResult = await db.$queryRaw`SELECT COUNT(*) as count FROM affiliate_links`
      linkCount = (linkCountResult as any)[0].count
    }

    if ((tablesExist as any)[0].conversions_exist === 1) {
      const conversionCountResult = await db.$queryRaw`SELECT COUNT(*) as count FROM affiliate_conversions`
      conversionCount = (conversionCountResult as any)[0].count
    }

    if ((tablesExist as any)[0].clicks_exist === 1) {
      const clickCountResult = await db.$queryRaw`SELECT COUNT(*) as count FROM affiliate_clicks`
      clickCount = (clickCountResult as any)[0].count
    }

    // Get sample data
    let links: AffiliateLinkWithCommission[] = []
    let conversions: AffiliateConversionWithRelations[] = []

    if ((tablesExist as any)[0].links_exist === 1) {
      links = (await db.affiliateLink.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      })) as unknown as AffiliateLinkWithCommission[]
    }

    if ((tablesExist as any)[0].conversions_exist === 1) {
      conversions = (await db.affiliateConversion.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          link: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      })) as unknown as AffiliateConversionWithRelations[]
    }

    return NextResponse.json({
      success: true,
      database: {
        info: dbInfo,
        tables: {
          affiliate_links: (tablesExist as any)[0].links_exist === 1,
          affiliate_conversions: (tablesExist as any)[0].conversions_exist === 1,
          affiliate_clicks: (tablesExist as any)[0].clicks_exist === 1,
          affiliate_settings: (tablesExist as any)[0].settings_exist === 1,
        },
        counts: {
          links: linkCount,
          conversions: conversionCount,
          clicks: clickCount,
        },
      },
      data: {
        links,
        conversions,
      },
    })
  } catch (error) {
    console.error("[DEBUG_ERROR]", error)
    return NextResponse.json({ error: "Failed to debug affiliate system", details: error }, { status: 500 })
  }
}

