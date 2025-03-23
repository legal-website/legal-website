import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Found invoice:", invoice.invoiceNumber)
    console.log(
      "Invoice details:",
      JSON.stringify(
        {
          id: invoice.id,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          amount: invoice.amount,
          status: invoice.status,
          customerCompany: invoice.customerCompany,
          customerAddress: invoice.customerAddress,
          customerCity: invoice.customerCity,
        },
        null,
        2,
      ),
    )

    // Update invoice status to paid
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })

    console.log("Invoice updated successfully")

    // AFFILIATE CONVERSION HANDLING
    try {
      // Extract affiliate code from invoice fields
      let affiliateCode = null

      // Check company field
      if (invoice.customerCompany && invoice.customerCompany.includes("ref:")) {
        const match = invoice.customerCompany.match(/ref:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          affiliateCode = match[1]
          console.log("Found affiliate code in company field:", affiliateCode)
        }
      }
      // Check address field
      else if (invoice.customerAddress && invoice.customerAddress.includes("ref:")) {
        const match = invoice.customerAddress.match(/ref:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          affiliateCode = match[1]
          console.log("Found affiliate code in address field:", affiliateCode)
        }
      }
      // Check city field
      else if (invoice.customerCity && invoice.customerCity.includes("ref:")) {
        const match = invoice.customerCity.match(/ref:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          affiliateCode = match[1]
          console.log("Found affiliate code in city field:", affiliateCode)
        }
      }

      console.log("Extracted affiliate code:", affiliateCode)

      // If we have an affiliate code, proceed with creating a conversion
      if (affiliateCode) {
        console.log("Processing conversion for affiliate code:", affiliateCode)

        // Find the affiliate link
        const affiliateLink = await db.affiliateLink.findFirst({
          where: { code: affiliateCode },
        })

        if (affiliateLink) {
          console.log("Found affiliate link ID:", affiliateLink.id)

          // Get commission rate from settings (default to 10% if not found)
          const settings = await db.affiliateSettings.findFirst()
          const commissionRate = settings?.commissionRate ? Number(settings.commissionRate) : 10
          console.log("Commission rate:", commissionRate)

          // Calculate commission amount
          const commission = (invoice.amount * commissionRate) / 100
          console.log("Calculated commission:", commission)

          // Check if a conversion already exists for this order
          const existingConversions = await db.affiliateConversion.findMany({
            where: { orderId: invoiceId },
          })

          if (existingConversions.length === 0) {
            // Create the conversion record
            try {
              const conversion = await db.affiliateConversion.create({
                data: {
                  linkId: affiliateLink.id,
                  orderId: invoiceId,
                  amount: invoice.amount,
                  commission: commission,
                  status: "APPROVED", // Set to APPROVED immediately
                },
              })
              console.log("Successfully created conversion record:", conversion.id)
            } catch (conversionError) {
              console.error("Error creating conversion record:", conversionError)
            }
          } else {
            console.log("Conversion already exists for this invoice:", existingConversions[0].id)
          }
        } else {
          console.log("No affiliate link found for code:", affiliateCode)
        }
      } else {
        console.log("No affiliate code found for this invoice")
      }
    } catch (affiliateError) {
      console.error("Error in affiliate conversion processing:", affiliateError)
    }

    // Send approval email
    try {
      await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)
      console.log("Approval email sent")
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

