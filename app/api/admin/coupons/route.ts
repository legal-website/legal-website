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

    // Build the where clause based on filters
    const where: any = {}

    if (status) {
      if (status === "active") {
        where.isActive = true
        where.startDate = { lte: new Date() }
        where.endDate = { gte: new Date() }
      } else if (status === "scheduled") {
        where.isActive = true
        where.startDate = { gt: new Date() }
      } else if (status === "expired") {
        where.OR = [{ isActive: false }, { endDate: { lt: new Date() } }]
      }
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Fetch coupons from database
    const coupons = await db.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    // Calculate status for each coupon
    const couponsWithStatus = coupons.map((coupon) => {
      let status = "Active"
      const now = new Date()

      if (!coupon.isActive) {
        status = "Expired"
      } else if (coupon.startDate > now) {
        status = "Scheduled"
      } else if (coupon.endDate < now) {
        status = "Expired"
      }

      return {
        ...coupon,
        status,
        clientIds: coupon.clientIds ? JSON.parse(coupon.clientIds) : [],
        // Format dates for display
        startDate: coupon.startDate.toISOString(),
        endDate: coupon.endDate.toISOString(),
        createdAt: coupon.createdAt.toISOString(),
        updatedAt: coupon.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({ coupons: couponsWithStatus })
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

