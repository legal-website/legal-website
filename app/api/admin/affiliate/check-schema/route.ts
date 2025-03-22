import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check affiliate_links table structure
    const linkColumns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'affiliate_links';
    `

    // Check affiliate_conversions table structure
    const conversionColumns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'affiliate_conversions';
    `

    return NextResponse.json({
      success: true,
      schema: {
        affiliateLinks: linkColumns,
        affiliateConversions: conversionColumns,
      },
    })
  } catch (error) {
    console.error("[CHECK_SCHEMA_ERROR]", error)
    return NextResponse.json({ error: "Failed to check schema", details: error }, { status: 500 })
  }
}

