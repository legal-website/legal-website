import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id
    console.log(`[AFFILIATE] Starting approval process for invoice: ${invoiceId}`)

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      console.log("Unauthorized approval attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the invoice with a direct query to ensure we get all fields
    const invoices = (await prisma.$queryRaw`
      SELECT * FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `) as any[]

    if (!invoices || invoices.length === 0) {
      console.log(`[AFFILIATE] Invoice not found: ${invoiceId}`)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoices[0]
    console.log(`[AFFILIATE] Found invoice: ${invoice.invoiceNumber} for ${invoice.customerEmail}`)

    // Update invoice status to paid
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })
    console.log(`[AFFILIATE] Updated invoice status to paid`)

    // Process affiliate conversion
    await processAffiliateConversion(invoice)

    // Send approval email
    try {
      await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)
      console.log(`[AFFILIATE] Sent approval email to ${invoice.customerEmail}`)
    } catch (emailError) {
      console.error(`[AFFILIATE] Error sending approval email:`, emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[AFFILIATE] Error approving invoice:`, error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

async function processAffiliateConversion(invoice: any) {
  try {
    console.log(`[AFFILIATE] Processing conversion for invoice ${invoice.id}`)

    // Check if we already have a conversion for this order
    const existingConversions = (await prisma.$queryRaw`
      SELECT * FROM affiliate_conversions WHERE orderId = ${invoice.id} LIMIT 1
    `) as any[]

    if (existingConversions && existingConversions.length > 0) {
      console.log(`[AFFILIATE] Conversion already exists for invoice ${invoice.id}`)
      return
    }

    // First check if there's affiliate info in the invoice metadata
    let affiliateCode = null
    if (invoice.metadata) {
      try {
        const metadata = JSON.parse(invoice.metadata)
        affiliateCode = metadata.affiliateCode
        console.log(`[AFFILIATE] Found affiliate code in metadata: ${affiliateCode}`)
      } catch (e) {
        console.error(`[AFFILIATE] Error parsing invoice metadata:`, e)
      }
    }

    // If no affiliate code in metadata, check the stored cookie
    if (!affiliateCode) {
      const storedCookie = await prisma.systemSettings.findFirst({
        where: { key: `affiliate_cookie_${invoice.customerEmail}` },
      })

      if (storedCookie) {
        affiliateCode = storedCookie.value
        console.log(`[AFFILIATE] Found affiliate code in stored cookie: ${affiliateCode}`)
      } else {
        console.log(`[AFFILIATE] No affiliate cookie found for ${invoice.customerEmail}`)
        return
      }
    }

    // Find the affiliate link
    const affiliateLinks = (await prisma.$queryRaw`
      SELECT * FROM affiliate_links WHERE code = ${affiliateCode} LIMIT 1
    `) as any[]

    if (!affiliateLinks || affiliateLinks.length === 0) {
      console.log(`[AFFILIATE] No affiliate link found for code: ${affiliateCode}`)
      return
    }

    const affiliateLink = affiliateLinks[0]
    console.log(`[AFFILIATE] Found affiliate link: ${affiliateLink.id} for user: ${affiliateLink.userId}`)

    // Get commission rate from settings
    const settingsRows = (await prisma.$queryRaw`
      SELECT * FROM affiliate_settings LIMIT 1
    `) as any[]

    const commissionRate = settingsRows && settingsRows.length > 0 ? Number(settingsRows[0].commissionRate) : 10

    console.log(`[AFFILIATE] Commission rate: ${commissionRate}%`)

    // Calculate commission
    const amount = Number(invoice.amount)
    const commission = (amount * commissionRate) / 100
    console.log(`[AFFILIATE] Calculated commission: ${commission} from amount: ${amount}`)

    // Create the conversion using raw SQL to avoid any Prisma issues
    await prisma.$executeRaw`
      INSERT INTO affiliate_conversions (
        linkId, orderId, amount, commission, status, createdAt, updatedAt
      ) VALUES (
        ${affiliateLink.id}, 
        ${invoice.id}, 
        ${amount}, 
        ${commission}, 
        ${AffiliateConversionStatus.PENDING},
        NOW(),
        NOW()
      )
    `

    console.log(`[AFFILIATE] Successfully recorded conversion for invoice ${invoice.id}`)
  } catch (error) {
    console.error(`[AFFILIATE] Error processing affiliate conversion:`, error)
    // Don't throw the error to avoid disrupting the main flow
  }
}

