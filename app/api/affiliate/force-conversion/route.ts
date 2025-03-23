import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId, affiliateCode } = await req.json()

    if (!invoiceId || !affiliateCode) {
      return NextResponse.json({ success: false, error: "Invoice ID and affiliate code are required" }, { status: 400 })
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    // Find the affiliate link
    const affiliateLink = await db.affiliateLink.findFirst({
      where: { code: affiliateCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!affiliateLink) {
      return NextResponse.json({ success: false, error: "Affiliate link not found" }, { status: 404 })
    }

    // Get commission rate from settings
    const settings = await db.affiliateSettings.findFirst()
    const commissionRate = settings?.commissionRate ? Number(settings.commissionRate) : 10

    // Calculate commission
    const commission = (invoice.amount * commissionRate) / 100

    // Check if a conversion already exists
    const existingConversions = await db.affiliateConversion.findMany({
      where: {
        orderId: invoiceId,
      },
      take: 1,
    })

    const existingConversion = existingConversions.length > 0 ? existingConversions[0] : null

    let conversion

    if (existingConversion) {
      // Update existing conversion
      conversion = await db.affiliateConversion.update({
        where: { id: existingConversion.id },
        data: {
          linkId: affiliateLink.id,
          amount: invoice.amount,
          commission,
          status: "APPROVED",
        },
      })
    } else {
      // Create new conversion
      conversion = await db.affiliateConversion.create({
        data: {
          linkId: affiliateLink.id,
          orderId: invoiceId,
          amount: invoice.amount,
          commission,
          status: "APPROVED",
        },
      })
    }

    // Update the invoice to include the affiliate code if it's not already there
    if (
      (!invoice.customerCompany || !invoice.customerCompany.includes("ref:")) &&
      (!invoice.customerAddress || !invoice.customerAddress.includes("ref:")) &&
      (!invoice.customerCity || !invoice.customerCity.includes("ref:"))
    ) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          customerCompany: invoice.customerCompany ? invoice.customerCompany : `ref:${affiliateCode}`,
        },
      })
    }

    // Safely access user properties with null checks
    const affiliateUser = affiliateLink.user
      ? {
          id: affiliateLink.user.id,
          name: affiliateLink.user.name || "Unknown",
          email: affiliateLink.user.email || "Unknown",
        }
      : {
          id: "Unknown",
          name: "Unknown",
          email: "Unknown",
        }

    return NextResponse.json({
      success: true,
      message: "Conversion created successfully",
      data: {
        conversion,
        affiliate: affiliateUser,
        invoice: {
          id: invoice.id,
          number: invoice.invoiceNumber,
          amount: invoice.amount,
        },
        commission,
      },
    })
  } catch (error) {
    console.error("Error creating forced conversion:", error)
    return NextResponse.json({ success: false, error: "Failed to create conversion" }, { status: 500 })
  }
}

