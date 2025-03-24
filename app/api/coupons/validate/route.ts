import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    if (!body.code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    // Fetch coupon by code
    const coupon = await db.coupon.findUnique({
      where: { code: body.code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 })
    }

    const now = new Date()

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({ error: "This coupon is no longer active" }, { status: 400 })
    }

    // Check if coupon has started
    if (coupon.startDate > now) {
      return NextResponse.json({ error: "This coupon is not yet active" }, { status: 400 })
    }

    // Check if coupon has expired
    if (coupon.endDate < now) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 })
    }

    // Check if coupon has reached usage limit
    if (coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 })
    }

    // Check if coupon is for specific clients
    if (coupon.specificClient && coupon.clientIds) {
      // If user is not logged in and coupon is for specific clients
      if (!session) {
        return NextResponse.json({ error: "Please log in to use this coupon" }, { status: 401 })
      }

      const clientIds = JSON.parse(coupon.clientIds)
      if (!clientIds.includes(session.user.id)) {
        return NextResponse.json({ error: "This coupon is not available for your account" }, { status: 403 })
      }
    }

    // Check if coupon is for new customers only
    if (coupon.newCustomersOnly && session) {
      // Check if user has any previous orders
      // Since we don't have direct access to invoice model, we'll handle this differently
      // This is a placeholder - in a real app, you'd check if the user has previous orders
      const hasOrders = false

      if (hasOrders) {
        return NextResponse.json({ error: "This coupon is for new customers only" }, { status: 403 })
      }
    }

    // Check if coupon is one per customer
    if (coupon.onePerCustomer && session) {
      // Check if user has already used this coupon
      const usageCount = await db.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: session.user.id,
        },
      })

      if (usageCount > 0) {
        return NextResponse.json({ error: "You have already used this coupon" }, { status: 403 })
      }
    }

    // Check minimum amount if provided in request
    if (coupon.minimumAmount && body.cartTotal) {
      if (Number.parseFloat(body.cartTotal) < Number.parseFloat(coupon.minimumAmount.toString())) {
        return NextResponse.json(
          {
            error: `This coupon requires a minimum order of $${coupon.minimumAmount}`,
          },
          { status: 400 },
        )
      }
    }

    // Calculate discount
    let discount = 0
    if (body.cartTotal) {
      const cartTotal = Number.parseFloat(body.cartTotal)

      if (coupon.type === "PERCENTAGE") {
        discount = cartTotal * (Number.parseFloat(coupon.value.toString()) / 100)
      } else if (coupon.type === "FIXED_AMOUNT") {
        discount = Math.min(cartTotal, Number.parseFloat(coupon.value.toString()))
      }
      // For FREE_SERVICE, the frontend will need to handle this differently
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        discount: discount,
      },
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 })
  }
}

