import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/prisma-types"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch coupon by ID with usages
    // Using Prisma's findUnique with explicit type casting to avoid TypeScript errors
    const coupon = await (db.coupon.findUnique as any)({
      where: { id: params.id },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Calculate status
    let status = "Active"
    const now = new Date()

    if (!coupon.isActive) {
      status = "Expired"
    } else if (coupon.startDate > now) {
      status = "Scheduled"
    } else if (coupon.endDate < now) {
      status = "Expired"
    }

    // Format response
    const formattedCoupon = {
      ...coupon,
      status,
      clientIds: coupon.clientIds ? JSON.parse(coupon.clientIds) : [],
      // Format dates for display
      startDate: coupon.startDate.toISOString(),
      endDate: coupon.endDate.toISOString(),
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
      usages: coupon.usages
        ? coupon.usages.map((usage: any) => ({
            ...usage,
            createdAt: usage.createdAt.toISOString(),
          }))
        : [],
    }

    return NextResponse.json({ coupon: formattedCoupon })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Check if updated code conflicts with another coupon
    if (body.code !== existingCoupon.code) {
      const codeExists = await db.coupon.findUnique({
        where: { code: body.code },
      })

      if (codeExists) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
      }
    }

    // Format client IDs if provided
    let clientIds = existingCoupon.clientIds
    if (body.specificClient && body.clientIds && body.clientIds.length > 0) {
      clientIds = JSON.stringify(body.clientIds)
    } else if (!body.specificClient) {
      clientIds = null
    }

    // Update coupon
    const updatedCoupon = await db.coupon.update({
      where: { id: params.id },
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        type: body.type,
        value: body.value,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        usageLimit: body.usageLimit,
        isActive: body.isActive,
        specificClient: body.specificClient || false,
        clientIds,
        minimumAmount: body.minimumAmount || null,
        onePerCustomer: body.onePerCustomer || false,
        newCustomersOnly: body.newCustomersOnly || false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ coupon: updatedCoupon })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Delete coupon
    await db.coupon.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}

