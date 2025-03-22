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

    // Check if tables exist
    const tablesExist = await db.$queryRaw`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_links') as links_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_conversions') as conversions_exist,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'affiliate_clicks') as clicks_exist
    `

    const { links_exist, conversions_exist, clicks_exist } = (tablesExist as any)[0]

    // Add missing columns to affiliate_links if it exists
    if (links_exist) {
      // Check if active column exists
      const activeExists = await db.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'affiliate_links' 
          AND column_name = 'active'
        ) as exists;
      `

      if (!(activeExists as any)[0].exists) {
        await db.$executeRaw`
          ALTER TABLE affiliate_links 
          ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
        `
      }

      // Check if commission column exists
      const commissionExists = await db.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'affiliate_links' 
          AND column_name = 'commission'
        ) as exists;
      `

      if (!(commissionExists as any)[0].exists) {
        await db.$executeRaw`
          ALTER TABLE affiliate_links 
          ADD COLUMN commission DECIMAL(10,2) NOT NULL DEFAULT 0.10;
        `
      }

      // Add unique constraint to userId if not exists
      // In MySQL, we need to check for indexes
      const userIdUniqueExists = await db.$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
        AND table_name = 'affiliate_links'
        AND column_name = 'userId'
        AND non_unique = 0;
      `

      if ((userIdUniqueExists as any)[0].count === 0) {
        // First check for duplicates
        const duplicates = await db.$queryRaw`
          SELECT userId, COUNT(*) as count
          FROM affiliate_links
          GROUP BY userId
          HAVING COUNT(*) > 1;
        `

        if ((duplicates as any).length > 0) {
          // Handle duplicates by keeping only the most recent
          for (const dup of duplicates as any) {
            const userId = dup.userId

            // Get all links for this user, ordered by updatedAt
            const links = await db.$queryRaw`
              SELECT id, updatedAt
              FROM affiliate_links
              WHERE userId = ${userId}
              ORDER BY updatedAt DESC;
            `

            // Keep the first one, delete the rest
            for (let i = 1; i < (links as any).length; i++) {
              await db.$executeRaw`
                DELETE FROM affiliate_links
                WHERE id = ${(links as any)[i].id};
              `
            }
          }
        }

        // Now add the unique constraint
        await db.$executeRaw`
          ALTER TABLE affiliate_links
          ADD UNIQUE INDEX affiliate_links_userId_key (userId);
        `
      }
    }

    // Add missing columns to affiliate_conversions if it exists
    if (conversions_exist) {
      // Check if customerEmail column exists
      const customerEmailExists = await db.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'affiliate_conversions' 
          AND column_name = 'customerEmail'
        ) as exists;
      `

      if (!(customerEmailExists as any)[0].exists) {
        await db.$executeRaw`
          ALTER TABLE affiliate_conversions 
          ADD COLUMN customerEmail VARCHAR(255);
        `
      }
    }

    return NextResponse.json({
      success: true,
      message: "Schema fixed successfully",
      tablesExist: {
        affiliate_links: links_exist === 1,
        affiliate_conversions: conversions_exist === 1,
        affiliate_clicks: clicks_exist === 1,
      },
    })
  } catch (error) {
    console.error("[FIX_SCHEMA_ERROR]", error)
    return NextResponse.json({ error: "Failed to fix schema", details: error }, { status: 500 })
  }
}

