import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    // Find coupons available for this user
    const coupons = await db.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        // We can't directly compare fields in Prisma, so we'll filter all coupons
        OR: [
          { specificClient: false },
          {
            specificClient: true,
            clientIds: { contains: userId },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    })

    // Filter out coupons that have reached their usage limit
    // Since we can't do this in the query, we'll do it in memory
    const availableCoupons = coupons.filter((coupon) => {
      return coupon.usageCount < coupon.usageLimit
    })

    // Filter out coupons that the user has already used (if onePerCustomer is true)
    const usedCouponIds = await db.couponUsage.findMany({
      where: { userId },
      select: { couponId: true },
    })

    const usedCouponIdSet = new Set(usedCouponIds.map((u) => u.couponId))

    const filteredCoupons = availableCoupons.filter((coupon) => {
      // If onePerCustomer is true and user has used this coupon, filter it out
      if (coupon.onePerCustomer && usedCouponIdSet.has(coupon.id)) {
        return false
      }

      return true
    })

    // Format coupons for response
    const formattedCoupons = filteredCoupons.map((coupon) => {
      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        expiresAt: coupon.endDate.toISOString(),
        minimumAmount: coupon.minimumAmount,
      }
    })

    return NextResponse.json({ coupons: formattedCoupons })
  } catch (error) {
    console.error("Error fetching user coupons:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

