import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { couponCode, invoiceId, userId, amount } = await req.json()

    if (!couponCode || !invoiceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Testing coupon usage for code: ${couponCode}, invoice: ${invoiceId}`)

    // Find the coupon
    const couponResult = (await db.$queryRaw`
      SELECT * FROM Coupon WHERE code = ${couponCode}
    `) as any[]

    if (!couponResult || couponResult.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    const coupon = couponResult[0]
    console.log("Found coupon:", coupon)

    // Check if usage already exists
    const existingUsageResult = (await db.$queryRaw`
      SELECT * FROM CouponUsage WHERE orderId = ${invoiceId}
    `) as any[]

    if (existingUsageResult && existingUsageResult.length > 0) {
      return NextResponse.json({
        message: "Usage already exists",
        usage: existingUsageResult[0],
      })
    }

    try {
      // Create usage record
      const usageId = uuidv4()
      await db.$executeRaw`
        INSERT INTO CouponUsage (id, couponId, userId, orderId, amount, createdAt)
        VALUES (${usageId}, ${coupon.id}, ${userId || null}, ${invoiceId}, ${amount || 0}, NOW())
      `

      console.log("Created usage record:", usageId)

      // Update coupon usage count
      await db.$executeRaw`
        UPDATE Coupon 
        SET usageCount = usageCount + 1 
        WHERE id = ${coupon.id}
      `

      console.log("Updated coupon usage count")
    } catch (error) {
      console.error("Error creating coupon usage:", error)
      return NextResponse.json({ error: "Failed to create coupon usage" }, { status: 500 })
    }

    // Get updated coupon
    const updatedCouponResult = (await db.$queryRaw`
      SELECT * FROM Coupon WHERE id = ${coupon.id}
    `) as any[]

    return NextResponse.json({
      success: true,
      message: "Coupon usage recorded successfully",
      coupon: updatedCouponResult[0],
    })
  } catch (error: any) {
    console.error("Error testing coupon usage:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

