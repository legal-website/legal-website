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

    // Add unique constraint to userId in affiliate_links table
    await db.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'affiliate_links_userId_key'
        ) THEN
          -- First check if there are any duplicate userId values
          IF EXISTS (
            SELECT userId FROM affiliate_links
            GROUP BY userId
            HAVING COUNT(*) > 1
          ) THEN
            -- Handle duplicates by keeping only the most recent affiliate link for each user
            WITH ranked_links AS (
              SELECT 
                id,
                userId,
                ROW_NUMBER() OVER (PARTITION BY userId ORDER BY updatedAt DESC) as rn
              FROM affiliate_links
            )
            DELETE FROM affiliate_links
            WHERE id IN (
              SELECT id FROM ranked_links WHERE rn > 1
            );
          END IF;
          
          -- Now add the unique constraint
          ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_userId_key" UNIQUE ("userId");
        END IF;
      END $$;
    `

    return NextResponse.json({
      success: true,
      message: "Schema fixed successfully",
    })
  } catch (error) {
    console.error("[FIX_SCHEMA_ERROR]", error)
    return NextResponse.json({ error: "Failed to fix schema", details: error }, { status: 500 })
  }
}

