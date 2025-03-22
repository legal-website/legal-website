import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if settings table exists
    const tableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_name = 'affiliate_settings'
      ) as exists;
    `

    if (!(tableExists as any)[0].exists) {
      // Create settings table
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS affiliate_settings (
          id INT NOT NULL AUTO_INCREMENT,
          commissionRate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
          minPayoutAmount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
          cookieDuration INT NOT NULL DEFAULT 30,
          updatedAt DATETIME NOT NULL,
          
          PRIMARY KEY (id)
        );
      `

      // Insert default settings
      await db.$executeRaw`
        INSERT INTO affiliate_settings (commissionRate, minPayoutAmount, cookieDuration, updatedAt)
        VALUES (10.00, 50.00, 30, NOW());
      `
    } else {
      // Check if there are any settings
      const settingsCount = await db.$queryRaw`
        SELECT COUNT(*) as count FROM affiliate_settings;
      `

      if ((settingsCount as any)[0].count === 0) {
        // Insert default settings
        await db.$executeRaw`
          INSERT INTO affiliate_settings (commissionRate, minPayoutAmount, cookieDuration, updatedAt)
          VALUES (10.00, 50.00, 30, NOW());
        `
      }
    }

    // Get current settings
    const settings = await db.$queryRaw`
      SELECT * FROM affiliate_settings LIMIT 1;
    `

    return NextResponse.json({
      success: true,
      message: "Affiliate settings created/updated successfully",
      settings: settings[0],
    })
  } catch (error) {
    console.error("[AFFILIATE_CREATE_SETTINGS]", error)
    return NextResponse.json({ error: "Failed to create settings", details: error }, { status: 500 })
  }
}

