import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"
import prisma from "@/lib/prisma"

interface CreateConversionRequest {
  invoiceId: string
  affiliateCode: string
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = (await req.json()) as CreateConversionRequest
    const { invoiceId, affiliateCode } = data

    if (!invoiceId || !affiliateCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[MANUAL] Creating conversion for invoice ${invoiceId} with affiliate code ${affiliateCode}`)

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Find the affiliate link
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: { code: affiliateCode },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Check if a conversion already exists
    const existingConversion = await prisma.affiliateConversion.findFirst({
      where: { orderId: invoiceId },
    })

    if (existingConversion) {
      return NextResponse.json(
        {
          error: "Conversion already exists for this invoice",
          conversion: existingConversion,
        },
        { status: 400 },
      )
    }

    // Get commission rate from settings
    const settings = (await prisma.affiliateSettings.findFirst()) || { commissionRate: 10 }
    const commissionRate = Number(settings.commissionRate)

    // Calculate commission
    const amount = invoice.amount
    const commission = (amount * commissionRate) / 100

    // Create the conversion
    const conversion = await prisma.affiliateConversion.create({
      data: {
        linkId: affiliateLink.id,
        orderId: invoiceId,
        amount,
        commission,
        status: AffiliateConversionStatus.PENDING,
      },
    })

    console.log(`[MANUAL] Successfully created conversion: ${conversion.id}`)

    return NextResponse.json({
      success: true,
      conversion,
      message: "Conversion created successfully",
    })
  } catch (error: any) {
    console.error("[MANUAL] Error creating conversion:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

