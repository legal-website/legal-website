import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/prisma-types"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const timestamp = searchParams.get("timestamp") // Cache busting parameter

    console.log("Fetching coupons with params:", { status, search, timestamp })

    // Get all coupons with their usage counts
    const couponsWithUsage = (await db.$queryRaw`
      SELECT c.*, COUNT(cu.id) as actualUsageCount
      FROM Coupon c
      LEFT JOIN CouponUsage cu ON c.id = cu.couponId
      GROUP BY c.id
    `) as any[]

    console.log(`Found ${couponsWithUsage.length} coupons`)

    // Update any coupons where the stored count doesn't match the actual count
    for (const coupon of couponsWithUsage) {
      if (coupon.usageCount !== Number(coupon.actualUsageCount)) {
        console.log(
          `Updating coupon ${coupon.code}: stored count ${coupon.usageCount} != actual count ${coupon.actualUsageCount}`,
        )

        await db.$executeRaw`
          UPDATE Coupon
          SET usageCount = ${Number(coupon.actualUsageCount)}
          WHERE id = ${coupon.id}
        `

        // Update the object for the response
        coupon.usageCount = Number(coupon.actualUsageCount)
      }
    }

    // Apply filters
    let filteredCoupons = [...couponsWithUsage]

    if (status) {
      const now = new Date()

      if (status === "active") {
        filteredCoupons = filteredCoupons.filter(
          (coupon) => coupon.isActive && new Date(coupon.startDate) <= now && new Date(coupon.endDate) >= now,
        )
      } else if (status === "scheduled") {
        filteredCoupons = filteredCoupons.filter((coupon) => coupon.isActive && new Date(coupon.startDate) > now)
      } else if (status === "expired") {
        filteredCoupons = filteredCoupons.filter((coupon) => !coupon.isActive || new Date(coupon.endDate) < now)
      }
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCoupons = filteredCoupons.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(searchLower) || coupon.description.toLowerCase().includes(searchLower),
      )
    }

    // Format coupons for response
    const formattedCoupons = filteredCoupons.map((coupon) => {
      // Calculate status
      let status = "Active"
      const now = new Date()

      if (!coupon.isActive) {
        status = "Expired"
      } else if (new Date(coupon.startDate) > now) {
        status = "Scheduled"
      } else if (new Date(coupon.endDate) < now) {
        status = "Expired"
      }

      return {
        ...coupon,
        status,
        clientIds: coupon.clientIds ? JSON.parse(coupon.clientIds) : [],
        startDate: new Date(coupon.startDate).toISOString(),
        endDate: new Date(coupon.endDate).toISOString(),
        createdAt: new Date(coupon.createdAt).toISOString(),
        updatedAt: new Date(coupon.updatedAt).toISOString(),
      }
    })

    // Set cache control headers
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")

    return NextResponse.json({ coupons: formattedCoupons }, { headers })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await req.json()

    // Validate required fields
    if (
      !body.code ||
      !body.description ||
      !body.type ||
      body.value === undefined ||
      !body.startDate ||
      !body.endDate ||
      body.usageLimit === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if coupon code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { code: body.code },
    })

    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    // Format client IDs if provided
    let clientIds = null
    if (body.specificClient && body.clientIds && body.clientIds.length > 0) {
      clientIds = JSON.stringify(body.clientIds)
    }

    // Create new coupon
    const coupon = await db.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        type: body.type,
        value: body.value,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        usageLimit: body.usageLimit,
        isActive: body.isActive !== false, // Default to true if not specified
        createdBy: session.user.id,
        specificClient: body.specificClient || false,
        clientIds,
        minimumAmount: body.minimumAmount || null,
        onePerCustomer: body.onePerCustomer || false,
        newCustomersOnly: body.newCustomersOnly || false,
      },
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}

