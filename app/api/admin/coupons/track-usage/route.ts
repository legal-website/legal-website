import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const { couponCode, invoiceId, amount, userId } = await req.json()

    if (!couponCode || !invoiceId) {
      return NextResponse.json({ error: "Missing required fields: couponCode and invoiceId" }, { status: 400 })
    }

    console.log(`Tracking usage for coupon ${couponCode} on invoice ${invoiceId}`)

    // Find the coupon
    const couponResult = (await db.$queryRaw`
      SELECT * FROM Coupon WHERE code = ${couponCode}
    `) as any[]

    if (!couponResult || couponResult.length === 0) {
      return NextResponse.json({ error: `Coupon with code ${couponCode} not found` }, { status: 404 })
    }

    const coupon = couponResult[0]
    console.log("Found coupon:", coupon)

    // Check if usage already exists for this invoice
    const existingUsageResult = (await db.$queryRaw`
      SELECT * FROM CouponUsage WHERE orderId = ${invoiceId}
    `) as any[]

    if (existingUsageResult && existingUsageResult.length > 0) {
      console.log("Coupon usage already exists for this invoice:", existingUsageResult[0])
      return NextResponse.json({
        success: true,
        message: "Coupon usage already recorded",
        usage: existingUsageResult[0],
      })
    }

    // Create usage record
    const usageId = uuidv4()
    const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount || 0

    await db.$executeRaw`
      INSERT INTO CouponUsage (id, couponId, userId, orderId, amount, createdAt)
      VALUES (${usageId}, ${coupon.id}, ${userId || null}, ${invoiceId}, ${numericAmount}, NOW())
    `

    console.log("Created coupon usage record:", usageId)

    // Update coupon usage count
    await db.$executeRaw`
      UPDATE Coupon 
      SET usageCount = usageCount + 1 
      WHERE id = ${coupon.id}
    `

    console.log("Updated coupon usage count")

    // Verify the update
    const updatedCouponResult = (await db.$queryRaw`
      SELECT * FROM Coupon WHERE id = ${coupon.id}
    `) as any[]

    if (updatedCouponResult && updatedCouponResult.length > 0) {
      console.log("Updated coupon:", updatedCouponResult[0])
    }

    return NextResponse.json({
      success: true,
      message: "Coupon usage tracked successfully",
      usageId,
      couponId: coupon.id,
    })
  } catch (error: any) {
    console.error("Error tracking coupon usage:", error)
    return NextResponse.json(
      {
        error: "Failed to track coupon usage",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

