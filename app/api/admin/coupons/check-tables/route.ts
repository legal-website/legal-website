import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Checking coupon tables...")

    // Check if Coupon table exists
    let couponTableExists = false
    try {
      await db.$queryRaw`SELECT 1 FROM Coupon LIMIT 1`
      couponTableExists = true
      console.log("Coupon table exists")
    } catch (error) {
      console.log("Coupon table does not exist")
    }

    // Check if CouponUsage table exists
    let couponUsageTableExists = false
    try {
      await db.$queryRaw`SELECT 1 FROM CouponUsage LIMIT 1`
      couponUsageTableExists = true
      console.log("CouponUsage table exists")
    } catch (error) {
      console.log("CouponUsage table does not exist")
    }

    // Create tables if they don't exist
    if (!couponTableExists) {
      console.log("Creating Coupon table...")
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS \`Coupon\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`code\` VARCHAR(191) NOT NULL UNIQUE,
          \`description\` VARCHAR(191) NOT NULL,
          \`type\` ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SERVICE') NOT NULL,
          \`value\` DECIMAL(10,2) NOT NULL,
          \`startDate\` DATETIME(3) NOT NULL,
          \`endDate\` DATETIME(3) NOT NULL,
          \`usageLimit\` INT NOT NULL,
          \`usageCount\` INT NOT NULL DEFAULT 0,
          \`isActive\` BOOLEAN NOT NULL DEFAULT true,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          \`createdBy\` VARCHAR(191) NOT NULL,
          \`specificClient\` BOOLEAN NOT NULL DEFAULT false,
          \`clientIds\` TEXT,
          \`minimumAmount\` DECIMAL(10,2),
          \`onePerCustomer\` BOOLEAN NOT NULL DEFAULT false,
          \`newCustomersOnly\` BOOLEAN NOT NULL DEFAULT false,
          
          PRIMARY KEY (\`id\`)
        )
      `
      console.log("Coupon table created")
    }

    if (!couponUsageTableExists) {
      console.log("Creating CouponUsage table...")
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS \`CouponUsage\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`couponId\` VARCHAR(191) NOT NULL,
          \`userId\` VARCHAR(191),
          \`orderId\` VARCHAR(191),
          \`amount\` DECIMAL(10,2) NOT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`couponId\`) REFERENCES \`Coupon\`(\`id\`) ON DELETE CASCADE
        )
      `
      console.log("CouponUsage table created")
    }

    return NextResponse.json({
      success: true,
      tables: {
        coupon: couponTableExists ? "exists" : "created",
        couponUsage: couponUsageTableExists ? "exists" : "created",
      },
    })
  } catch (error) {
    console.error("Error checking/creating coupon tables:", error)
    return NextResponse.json({ error: "Failed to check/create coupon tables" }, { status: 500 })
  }
}

// Also support POST for API consistency
export async function POST(req: NextRequest) {
  return GET(req)
}

