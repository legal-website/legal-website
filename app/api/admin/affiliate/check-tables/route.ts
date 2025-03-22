import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if the affiliate_conversions table exists
    const tableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'affiliate_conversions'
      ) as exists;
    `

    // Check if the affiliate_links table exists
    const linksTableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'affiliate_links'
      ) as exists;
    `

    // Check if the affiliate_clicks table exists
    const clicksTableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'affiliate_clicks'
      ) as exists;
    `

    return NextResponse.json({
      success: true,
      tables: {
        affiliate_conversions: (tableCheck as any)[0].exists,
        affiliate_links: (linksTableCheck as any)[0].exists,
        affiliate_clicks: (clicksTableCheck as any)[0].exists,
      },
    })
  } catch (error) {
    console.error("[AFFILIATE_CHECK_TABLES]", error)
    return NextResponse.json({ error: "Failed to check tables", details: error }, { status: 500 })
  }
}

