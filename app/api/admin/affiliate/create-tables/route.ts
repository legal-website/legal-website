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

    // Create affiliate_links table if it doesn't exist
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "affiliate_links" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "commission" DECIMAL(10,2) NOT NULL DEFAULT 0.10,

        CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "affiliate_links_code_key" UNIQUE ("code")
      );
    `

    // Create affiliate_clicks table if it doesn't exist
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
        "id" TEXT NOT NULL,
        "linkId" TEXT NOT NULL,
        "ip" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
      );
    `

    // Create affiliate_conversions table if it doesn't exist
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "affiliate_conversions" (
        "id" TEXT NOT NULL,
        "linkId" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "commission" DECIMAL(10,2) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "customerEmail" TEXT,

        CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
      );
    `

    // Create foreign key constraints
    await db.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'affiliate_clicks_linkId_fkey'
        ) THEN
          ALTER TABLE "affiliate_clicks" 
          ADD CONSTRAINT "affiliate_clicks_linkId_fkey" 
          FOREIGN KEY ("linkId") 
          REFERENCES "affiliate_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'affiliate_conversions_linkId_fkey'
        ) THEN
          ALTER TABLE "affiliate_conversions" 
          ADD CONSTRAINT "affiliate_conversions_linkId_fkey" 
          FOREIGN KEY ("linkId") 
          REFERENCES "affiliate_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    // Create indexes for better performance
    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS "affiliate_links_userId_idx" ON "affiliate_links"("userId");
      CREATE INDEX IF NOT EXISTS "affiliate_links_code_idx" ON "affiliate_links"("code");
      CREATE INDEX IF NOT EXISTS "affiliate_clicks_linkId_idx" ON "affiliate_clicks"("linkId");
      CREATE INDEX IF NOT EXISTS "affiliate_conversions_linkId_idx" ON "affiliate_conversions"("linkId");
      CREATE INDEX IF NOT EXISTS "affiliate_conversions_orderId_idx" ON "affiliate_conversions"("orderId");
    `

    return NextResponse.json({
      success: true,
      message: "Affiliate tables created successfully",
    })
  } catch (error) {
    console.error("[AFFILIATE_CREATE_TABLES]", error)
    return NextResponse.json({ error: "Failed to create tables", details: error }, { status: 500 })
  }
}

