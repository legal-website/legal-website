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

    // Add index to userId in affiliate_links table
    await db.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'affiliate_links' AND indexname = 'affiliate_links_userId_idx'
        ) THEN
          CREATE INDEX "affiliate_links_userId_idx" ON "affiliate_links"("userId");
        END IF;
      END $$;
    `

    // Add unique constraint to code in affiliate_links table
    await db.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'affiliate_links_code_key'
        ) THEN
          ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_code_key" UNIQUE ("code");
        END IF;
      END $$;
    `

    // Add customerEmail column to affiliate_conversions if it doesn't exist
    await db.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'affiliate_conversions' AND column_name = 'customerEmail'
        ) THEN
          ALTER TABLE "affiliate_conversions" ADD COLUMN "customerEmail" TEXT;
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

