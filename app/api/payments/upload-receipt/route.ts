import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { storeAffiliateCookie } from "@/lib/store-affiliate-cookie"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string
    const affiliateCode = formData.get("affiliateCode") as string | null

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

