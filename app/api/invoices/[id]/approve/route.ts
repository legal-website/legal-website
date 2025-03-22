import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
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
      // Get the invoice metadata to check for affiliate code
      let affiliateCode = null
      if (invoice.metadata) {
        try {
          const metadata = JSON.parse(invoice.metadata as string)
          affiliateCode = metadata.affiliateCode
          console.log("Found affiliate code in metadata:", affiliateCode)
        } catch (e) {
          console.error("Error parsing invoice metadata:", e)
        }
      }

      if (affiliateCode) {
        // Find the affiliate link
        const affiliateLink = await prisma.affiliateLink.findFirst({
          where: { code: affiliateCode },
        })

        if (affiliateLink) {
          console.log("Found affiliate link:", affiliateLink.id, "for user:", affiliateLink.userId)

          // Check if a conversion already exists for this order
          const existingConversion = await prisma.affiliateConversion.findFirst({
            where: { orderId: invoiceId },
          })

          if (!existingConversion) {
            console.log("No existing conversion found, creating new one")

            // Get commission rate from settings
            const settings = (await prisma.affiliateSettings.findFirst()) || { commissionRate: 10 }
            const commissionRate = Number(settings.commissionRate)

            // Calculate commission
            const commission = (invoice.amount * commissionRate) / 100

            // Record the conversion
            const newConversion = await prisma.affiliateConversion.create({
              data: {
                linkId: affiliateLink.id,
                orderId: invoiceId,
                amount: invoice.amount,
                commission,
                status: "PENDING",
                customerEmail: invoice.customerEmail,
              },
            })

            console.log(
              `Recorded affiliate conversion for invoice ${invoiceId} with commission ${commission}`,
              newConversion,
            )
          } else {
            console.log(`Conversion already exists for invoice ${invoiceId}`, existingConversion)
          }
        } else {
          console.log("No affiliate link found for code:", affiliateCode)
        }
      } else {
        console.log("No affiliate code found in invoice metadata")
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

