import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { storeAffiliateCookie } from "@/lib/store-affiliate-cookie"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string
    const affiliateCode = formData.get("affiliateCode") as string | null
    const couponCode = formData.get("couponCode") as string | null

    console.log("Receipt upload with:", { invoiceId, affiliateCode, couponCode })

    if (!file || !invoiceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload file to storage (implementation depends on your storage solution)
    // For example, using Cloudinary or similar service
    const fileUrl = await uploadFile(file)

    // Update invoice with receipt URL
    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: { paymentReceipt: fileUrl },
    })

    // If affiliate code was provided, store it
    if (affiliateCode && invoice.customerEmail) {
      await storeAffiliateCookie(invoice.customerEmail, affiliateCode)
      console.log(`Stored affiliate code ${affiliateCode} for user ${invoice.customerEmail} during receipt upload`)
    }

    // If coupon code was provided, track its usage
    if (couponCode) {
      try {
        console.log(`Processing coupon usage for code: ${couponCode}`)

        // Find the coupon
        const couponResult = (await db.$queryRaw`
          SELECT * FROM Coupon WHERE code = ${couponCode}
        `) as any[]

        if (couponResult && couponResult.length > 0) {
          const coupon = couponResult[0]
          console.log("Found coupon:", coupon)

          // Check if usage already exists for this invoice
          const existingUsageResult = (await db.$queryRaw`
            SELECT * FROM CouponUsage WHERE orderId = ${invoiceId}
          `) as any[]

          if (!existingUsageResult || existingUsageResult.length === 0) {
            // Create usage record
            const usageId = uuidv4()
            await db.$executeRaw`
              INSERT INTO CouponUsage (id, couponId, userId, orderId, amount, createdAt)
              VALUES (${usageId}, ${coupon.id}, ${invoice.userId || null}, ${invoiceId}, ${invoice.amount || 0}, NOW())
            `

            console.log("Created coupon usage record:", usageId)

            // Update coupon usage count
            await db.$executeRaw`
              UPDATE Coupon 
              SET usageCount = usageCount + 1 
              WHERE id = ${coupon.id}
            `

            console.log("Updated coupon usage count")
          } else {
            console.log("Coupon usage already exists for this invoice:", existingUsageResult[0])
          }
        } else {
          console.log(`Coupon with code ${couponCode} not found`)
        }
      } catch (error) {
        console.error("Error tracking coupon usage:", error)
        // Continue with the process even if coupon tracking fails
      }
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message || "Failed to upload receipt" }, { status: 500 })
  }
}

// Mock implementation - replace with your actual file upload logic
async function uploadFile(file: File): Promise<string> {
  // This is a placeholder - implement your actual file upload logic
  // For example, using Cloudinary, AWS S3, etc.
  return `https://example.com/uploads/${file.name}`
}

