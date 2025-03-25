import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Helper function to process coupon usage
async function processCouponUsage(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parameters from request
    let couponCode, invoiceId, userId, amount

    // Handle both GET and POST requests
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url)
      couponCode = searchParams.get("couponCode")
      invoiceId = searchParams.get("invoiceId")
      userId = searchParams.get("userId")
      amount = searchParams.get("amount") ? Number.parseFloat(searchParams.get("amount")!) : 0
    } else {
      const body = await req.json()
      couponCode = body.couponCode
      invoiceId = body.invoiceId
      userId = body.userId
      amount = body.amount || 0
    }

    if (!couponCode || !invoiceId) {
      return NextResponse.json({ error: "Missing required parameters: couponCode and invoiceId" }, { status: 400 })
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

// Support both GET and POST methods
export async function GET(req: NextRequest) {
  return processCouponUsage(req)
}

export async function POST(req: NextRequest) {
  return processCouponUsage(req)
}

