import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId, affiliateCode } = await req.json()

    if (!invoiceId || !affiliateCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the invoice
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

    // Get commission rate from settings
    const settings = await db.affiliateSettings.findFirst()
    const commissionRate = settings?.commissionRate ? Number(settings.commissionRate) : 10

    // Calculate commission
    const commission = (invoice.amount * commissionRate) / 100

    // Create conversion
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
      conversion,
    })
  } catch (error: any) {
    console.error("Error forcing conversion:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

