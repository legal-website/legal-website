import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, affiliateCode } = await req.json()

    if (!invoiceId || !affiliateCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Manually tracking conversion for invoice ${invoiceId} with affiliate code ${affiliateCode}`)

    // Find the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Find the affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { code: affiliateCode },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Get commission rate from settings (default to 10% if not found)
    const settings = await db.affiliateSettings.findFirst()
    const commissionRate = settings?.commissionRate ? Number(settings.commissionRate) : 10

    // Calculate commission amount
    const commission = (invoice.amount * commissionRate) / 100

    // Check if a conversion already exists for this order
    const existingConversions = await db.affiliateConversion.findMany({
      where: { orderId: invoiceId },
    })

    if (existingConversions.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Conversion already exists",
        conversion: existingConversions[0],
      })
    }

    // Create the conversion record
    const conversion = await db.affiliateConversion.create({
      data: {
        linkId: affiliateLink.id,
        orderId: invoiceId,
        amount: invoice.amount,
        commission: commission,
        status: "APPROVED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Conversion tracked successfully",
      conversion,
    })
  } catch (error: any) {
    console.error("Error tracking conversion:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

