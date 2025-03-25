import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/prisma-types"
import { v4 as uuidv4 } from "uuid"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Approving invoice:", params.id)

    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      console.log("Unauthorized approval attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Get the invoice
    const invoiceResult = (await db.$queryRaw`
      SELECT * FROM Invoice WHERE id = ${invoiceId}
    `) as any[]

    if (!invoiceResult || invoiceResult.length === 0) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceResult[0]

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
    await db.$executeRaw`
      UPDATE Invoice 
      SET status = 'paid', paymentDate = NOW() 
      WHERE id = ${invoiceId}
    `

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
        const affiliateLinkResult = (await db.$queryRaw`
          SELECT * FROM affiliate_links WHERE code = ${affiliateCode}
        `) as any[]

        if (affiliateLinkResult && affiliateLinkResult.length > 0) {
          const affiliateLink = affiliateLinkResult[0]
          console.log("Found affiliate link ID:", affiliateLink.id)

          // Get commission rate from settings (default to 10% if not found)
          const settingsResult = (await db.$queryRaw`
            SELECT * FROM affiliate_settings LIMIT 1
          `) as any[]

          const settings = settingsResult && settingsResult.length > 0 ? settingsResult[0] : null
          const commissionRate = settings?.commissionRate ? Number(settings.commissionRate) : 10
          console.log("Commission rate:", commissionRate)

          // Calculate commission amount
          const commission = (invoice.amount * commissionRate) / 100
          console.log("Calculated commission:", commission)

          // Check if a conversion already exists for this order
          const existingConversionsResult = (await db.$queryRaw`
            SELECT * FROM affiliate_conversions WHERE orderId = ${invoiceId}
          `) as any[]

          if (!existingConversionsResult || existingConversionsResult.length === 0) {
            // Create the conversion record
            try {
              const conversionId = uuidv4()
              await db.$executeRaw`
                INSERT INTO affiliate_conversions (
                  id, linkId, orderId, amount, commission, status, createdAt, updatedAt
                ) VALUES (
                  ${conversionId}, 
                  ${affiliateLink.id}, 
                  ${invoiceId}, 
                  ${invoice.amount}, 
                  ${commission}, 
                  'PENDING', 
                  NOW(), 
                  NOW()
                )
              `
              console.log("Successfully created conversion record:", conversionId)
            } catch (conversionError) {
              console.error("Error creating conversion record:", conversionError)
            }
          } else {
            console.log("Conversion already exists for this invoice:", existingConversionsResult[0].id)
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
      if (invoice.customerCompany && invoice.customerCompany.includes("coupon:")) {
        const match = invoice.customerCompany.match(/coupon:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          couponCode = match[1].toUpperCase()
          console.log("Found coupon code in company field:", couponCode)
        }
      }
      // Check address field
      else if (invoice.customerAddress && invoice.customerAddress.includes("coupon:")) {
        const match = invoice.customerAddress.match(/coupon:([a-zA-Z0-9]+)/)
        if (match && match[1]) {
          couponCode = match[1].toUpperCase()
          console.log("Found coupon code in address field:", couponCode)
        }
      }
      // Check city field
      else if (invoice.customerCity && invoice.customerCity.includes("coupon:")) {
        const match = invoice.customerCity.match(/coupon:([a-zA-Z0-9]+)/)
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
        const couponResult = (await db.$queryRaw`
          SELECT * FROM Coupon WHERE code = ${couponCode}
        `) as any[]

        if (couponResult && couponResult.length > 0) {
          const coupon = couponResult[0]
          console.log("Found coupon ID:", coupon.id)

          // Check if a usage record already exists for this order
          const existingUsageResult = (await db.$queryRaw`
            SELECT * FROM CouponUsage WHERE orderId = ${invoiceId}
          `) as any[]

          if (!existingUsageResult || existingUsageResult.length === 0) {
            try {
              // Create a unique ID for the usage record
              const usageId = uuidv4()
              console.log("Generated usage ID:", usageId)

              // Create the usage record
              await db.$executeRaw`
                INSERT INTO CouponUsage (id, couponId, userId, orderId, amount, createdAt)
                VALUES (${usageId}, ${coupon.id}, ${invoice.userId || null}, ${invoiceId}, ${invoice.amount}, NOW())
              `

              console.log("Successfully created coupon usage record with ID:", usageId)

              // Update the coupon usage count
              await db.$executeRaw`
                UPDATE Coupon 
                SET usageCount = usageCount + 1 
                WHERE id = ${coupon.id}
              `

              console.log("Updated coupon usage count for coupon ID:", coupon.id)

              // Verify the update was successful
              const updatedCoupon = (await db.$queryRaw`
                SELECT * FROM Coupon WHERE id = ${coupon.id}
              `) as any[]

              if (updatedCoupon && updatedCoupon.length > 0) {
                console.log("Coupon usage count after update:", updatedCoupon[0].usageCount)
              }
            } catch (error) {
              console.error("Error updating coupon usage:", error)
            }
          } else {
            console.log("Coupon usage already exists for this invoice:", existingUsageResult[0].id)
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
      await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)
      console.log("Approval email sent")
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
    }

    // Get the updated invoice for the response
    const updatedInvoiceResult = (await db.$queryRaw`
      SELECT * FROM Invoice WHERE id = ${invoiceId}
    `) as any[]

    return NextResponse.json({
      success: true,
      invoice: updatedInvoiceResult && updatedInvoiceResult.length > 0 ? updatedInvoiceResult[0] : null,
    })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

