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

    // Create affiliate_links table if it doesn't exist - MySQL syntax
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        code VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        commission DECIMAL(10,2) NOT NULL DEFAULT 0.10,

        PRIMARY KEY (id),
        UNIQUE KEY affiliate_links_code_key (code),
        UNIQUE KEY affiliate_links_userId_key (userId)
      );
    `

    // Create affiliate_clicks table if it doesn't exist - MySQL syntax
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id VARCHAR(255) NOT NULL,
        linkId VARCHAR(255) NOT NULL,
        ip VARCHAR(255),
        userAgent TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id),
        INDEX affiliate_clicks_linkId_idx (linkId)
      );
    `

    // Create affiliate_conversions table if it doesn't exist - MySQL syntax
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS affiliate_conversions (
        id VARCHAR(255) NOT NULL,
        linkId VARCHAR(255) NOT NULL,
        orderId VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'pending',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL,
        customerEmail VARCHAR(255),

        PRIMARY KEY (id),
        INDEX affiliate_conversions_linkId_idx (linkId),
        INDEX affiliate_conversions_orderId_idx (orderId)
      );
    `

    // Create foreign key constraints - MySQL syntax
    await db.$executeRaw`
      ALTER TABLE affiliate_clicks
      ADD CONSTRAINT affiliate_clicks_linkId_fkey
      FOREIGN KEY (linkId)
      REFERENCES affiliate_links(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `

    await db.$executeRaw`
      ALTER TABLE affiliate_conversions
      ADD CONSTRAINT affiliate_conversions_linkId_fkey
      FOREIGN KEY (linkId)
      REFERENCES affiliate_links(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `

    // Create indexes for better performance - MySQL syntax
    await db.$executeRaw`
      CREATE INDEX affiliate_links_userId_idx ON affiliate_links(userId);
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

