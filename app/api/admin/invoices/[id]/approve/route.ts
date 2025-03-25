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
    const invoice = await db.$queryRawUnsafe(
      `
      SELECT * FROM Invoice WHERE id = ?
    `,
      invoiceId,
    )

    if (!invoice || !Array.isArray(invoice) || invoice.length === 0) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Since the result is an array, get the first item
    const invoiceData = invoice[0]

    console.log("Found invoice:", invoiceData.invoiceNumber)
    console.log(
      "Invoice details:",
      JSON.stringify(
        {
          id: invoiceData.id,
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail,
          amount: invoiceData.amount,
          status: invoiceData.status,
          customerCompany: invoiceData.customerCompany,
          customerAddress: invoiceData.customerAddress,
          customerCity: invoiceData.customerCity,
        },
        null,
        2,
      ),
    )

    // Update invoice status to paid
    await db.$executeRawUnsafe(
      `
      UPDATE Invoice 
      SET status = 'paid', paymentDate = NOW() 
      WHERE id = ?
    `,
      invoiceId,
    )

    console.log("Invoice updated successfully")

    // AFFILIATE CONVERSION HANDLING
    try {
      // Extract affiliate code from invoice fields
      let affiliateCode = null

      // Check company field
      if (invoiceData.customerCompany && invoiceData.customerCompany.includes("ref:")) {
        const match = invoiceData.customerCompany.match(/ref:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          affiliateCode = match[1]
          console.log("Found affiliate code in company field:", affiliateCode)
        }
      }
      // Check address field
      else if (invoiceData.customerAddress && invoiceData.customerAddress.includes("ref:")) {
        const match = invoiceData.customerAddress.match(/ref:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          affiliateCode = match[1]
          console.log("Found affiliate code in address field:", affiliateCode)
        }
      }
      // Check city field
      else if (invoiceData.customerCity && invoiceData.customerCity.includes("ref:")) {
        const match = invoiceData.customerCity.match(/ref:([a-zA-Z0-9]+)/)
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
          const commission = (invoiceData.amount * commissionRate) / 100
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
                  amount: invoiceData.amount,
                  commission: commission,
                  // Set to PENDING so it appears in current balance
                  status: "PENDING",
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

    // COUPON USAGE HANDLING
    try {
      // Extract coupon code from invoice fields
      let couponCode = null

      // Check company field
      if (invoiceData.customerCompany && invoiceData.customerCompany.includes("coupon:")) {
        const match = invoiceData.customerCompany.match(/coupon:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          couponCode = match[1].toUpperCase()
          console.log("Found coupon code in company field:", couponCode)
        }
      }
      // Check address field
      else if (invoiceData.customerAddress && invoiceData.customerAddress.includes("coupon:")) {
        const match = invoiceData.customerAddress.match(/coupon:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          couponCode = match[1].toUpperCase()
          console.log("Found coupon code in address field:", couponCode)
        }
      }
      // Check city field
      else if (invoiceData.customerCity && invoiceData.customerCity.includes("coupon:")) {
        const match = invoiceData.customerCity.match(/coupon:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          couponCode = match[1].toUpperCase()
          console.log("Found coupon code in city field:", couponCode)
        }
      }

      console.log("Extracted coupon code:", couponCode)

      // If we have a coupon code, proceed with updating usage
      if (couponCode) {
        console.log("Processing coupon usage for code:", couponCode)

        // Find the coupon
        const coupon = await db.coupon.findUnique({
          where: { code: couponCode },
        })

        if (coupon) {
          console.log("Found coupon ID:", coupon.id)

          // Check if a usage record already exists for this order
          const existingUsages = await db.couponUsage.findMany({
            where: { orderId: invoiceId },
          })

          if (existingUsages.length === 0) {
            // Create the usage record
            try {
              const usage = await db.couponUsage.create({
                data: {
                  couponId: coupon.id,
                  userId: invoiceData.userId,
                  orderId: invoiceId,
                  amount: invoiceData.amount,
                },
              })
              console.log("Successfully created coupon usage record:", usage.id)

              // Update the coupon usage count
              await db.coupon.update({
                where: { id: coupon.id },
                data: {
                  usageCount: {
                    increment: 1,
                  },
                },
              })
              console.log("Updated coupon usage count")
            } catch (usageError) {
              console.error("Error creating coupon usage record:", usageError)
            }
          } else {
            console.log("Coupon usage already exists for this invoice:", existingUsages[0].id)
          }
        } else {
          console.log("No coupon found for code:", couponCode)
        }
      } else {
        console.log("No coupon code found for this invoice")
      }
    } catch (couponError) {
      console.error("Error in coupon usage processing:", couponError)
    }

    // Send approval email
    try {
      await sendPaymentApprovalEmail(invoiceData.customerEmail, invoiceData.customerName, invoiceId)
      console.log("Approval email sent")
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
    }

    // Get the updated invoice for the response
    const updatedInvoice = await db.$queryRawUnsafe(
      `
      SELECT * FROM Invoice WHERE id = ?
    `,
      invoiceId,
    )

    return NextResponse.json({
      success: true,
      invoice: Array.isArray(updatedInvoice) && updatedInvoice.length > 0 ? updatedInvoice[0] : null,
    })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

