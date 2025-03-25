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

    // Get coupon code from query params if provided
    const { searchParams } = new URL(req.url)
    const couponCode = searchParams.get("code")

    let coupons = []
    let usages = []

    // Get all coupons or a specific one
    if (couponCode) {
      coupons = (await db.$queryRaw`
        SELECT * FROM Coupon WHERE code = ${couponCode}
      `) as any[]

      if (coupons.length > 0) {
        usages = (await db.$queryRaw`
          SELECT * FROM CouponUsage WHERE couponId = ${coupons[0].id}
        `) as any[]
      }
    } else {
      coupons = (await db.$queryRaw`SELECT * FROM Coupon`) as any[]
      usages = (await db.$queryRaw`SELECT * FROM CouponUsage`) as any[]
    }

    // Get table structure
    const couponStructure = (await db.$queryRaw`
      DESCRIBE Coupon
    `) as any[]

    const usageStructure = (await db.$queryRaw`
      DESCRIBE CouponUsage
    `) as any[]

    return NextResponse.json({
      success: true,
      tables: {
        coupon: {
          structure: couponStructure,
          count: coupons.length,
          records: coupons,
        },
        couponUsage: {
          structure: usageStructure,
          count: usages.length,
          records: usages,
        },
      },
    })
  } catch (error) {
    console.error("Error debugging coupons:", error)
    return NextResponse.json({ error: "Failed to debug coupons" }, { status: 500 })
  }
}

