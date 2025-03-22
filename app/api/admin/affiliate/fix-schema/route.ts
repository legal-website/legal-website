import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { safeDbOperation, tableExists, columnExists } from "@/lib/db-utils"

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tables exist
    const linksExist = await tableExists("affiliate_links")
    const conversionsExist = await tableExists("affiliate_conversions")
    const clicksExist = await tableExists("affiliate_clicks")

    const results = {
      links: { exists: linksExist, modified: false },
      conversions: { exists: conversionsExist, modified: false },
      clicks: { exists: clicksExist, modified: false },
    }

    // Add missing columns to affiliate_links if it exists
    if (linksExist) {
      // Check if active column exists
      const activeExists = await columnExists("affiliate_links", "active")

      if (!activeExists) {
        const success = await safeDbOperation(async () => {
          await db.$executeRaw`
            ALTER TABLE affiliate_links 
            ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
          `
        }, "Failed to add active column to affiliate_links")

        if (success) {
          results.links.modified = true
        }
      }

      // Check if commission column exists
      const commissionExists = await columnExists("affiliate_links", "commission")

      if (!commissionExists) {
        const success = await safeDbOperation(async () => {
          await db.$executeRaw`
            ALTER TABLE affiliate_links 
            ADD COLUMN commission DECIMAL(10,2) NOT NULL DEFAULT 0.10;
          `
        }, "Failed to add commission column to affiliate_links")

        if (success) {
          results.links.modified = true
        }
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
              await safeDbOperation(
                async () => {
                  await db.$executeRaw`
                  DELETE FROM affiliate_links
                  WHERE id = ${(links as any)[i].id};
                `
                },
                `Failed to delete duplicate affiliate link ${(links as any)[i].id}`,
              )
            }
          }
        }

        // Now add the unique constraint
        const success = await safeDbOperation(async () => {
          await db.$executeRaw`
            ALTER TABLE affiliate_links
            ADD UNIQUE INDEX affiliate_links_userId_key (userId);
          `
        }, "Failed to add unique constraint to userId in affiliate_links")

        if (success) {
          results.links.modified = true
        }
      }
    }

    // Add missing columns to affiliate_conversions if it exists
    if (conversionsExist) {
      // Check if customerEmail column exists
      const customerEmailExists = await columnExists("affiliate_conversions", "customerEmail")

      if (!customerEmailExists) {
        const success = await safeDbOperation(async () => {
          await db.$executeRaw`
            ALTER TABLE affiliate_conversions 
            ADD COLUMN customerEmail VARCHAR(255);
          `
        }, "Failed to add customerEmail column to affiliate_conversions")

        if (success) {
          results.conversions.modified = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Schema check completed",
      results,
    })
  } catch (error) {
    console.error("[FIX_SCHEMA_ERROR]", error)
    return NextResponse.json({ error: "Failed to fix schema", details: error }, { status: 500 })
  }
}

