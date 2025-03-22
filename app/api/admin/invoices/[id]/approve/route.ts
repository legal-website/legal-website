import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Approving invoice:", params.id)

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      console.log("Unauthorized approval attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Found invoice:", invoice.invoiceNumber)

    // Update invoice status to paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })

    console.log("Invoice updated successfully")

    // Check for affiliate referral and record conversion
    try {
      // Get the user's email from the invoice
      const userEmail = invoice.customerEmail

      // Check if we have stored affiliate information for this user
      const userAffiliateCookie = await prisma.systemSettings.findFirst({
        where: {
          key: `affiliate_cookie_${userEmail}`,
        },
      })

      if (userAffiliateCookie) {
        console.log("Found affiliate cookie for user:", userEmail)
        const affiliateCode = userAffiliateCookie.value

        // Find the affiliate link
        const affiliateLink = await prisma.affiliateLink.findFirst({
          where: { code: affiliateCode },
        })

        if (affiliateLink) {
          console.log("Found affiliate link:", affiliateLink.id)

          // Get commission rate from settings
          const settings = (await prisma.affiliateSettings.findFirst()) || { commissionRate: 10 }

          // Calculate commission (10% of invoice amount)
          const commission = (invoice.amount * Number(settings.commissionRate)) / 100

          // Check if a conversion already exists for this order
          const existingConversion = await prisma.$queryRaw`
            SELECT * FROM affiliate_conversions WHERE orderId = ${invoiceId} LIMIT 1
          `

          if (!existingConversion || (Array.isArray(existingConversion) && existingConversion.length === 0)) {
            // Record the conversion
            await prisma.affiliateConversion.create({
              data: {
                linkId: affiliateLink.id,
                orderId: invoiceId,
                amount: invoice.amount,
                commission,
                status: AffiliateConversionStatus.PENDING,
              },
            })

            console.log(`Recorded affiliate conversion for invoice ${invoiceId} with commission ${commission}`)
          } else {
            console.log(`Conversion already exists for invoice ${invoiceId}`)
          }
        }
      } else {
        console.log("No affiliate cookie found for user:", userEmail)
      }
    } catch (affiliateError) {
      // Don't let affiliate tracking errors disrupt the main flow
      console.error("Error processing affiliate conversion:", affiliateError)
    }

    // Send approval email
    try {
      await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)
      console.log("Approval email sent")
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

