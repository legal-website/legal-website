import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

interface InvoiceRecord {
  id: string
  customerEmail: string
  amount: number
  metadata: string
  [key: string]: any
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    console.log(`[INVOICE APPROVAL] Processing approval for invoice: ${id}`)

    // Get the invoice
    const invoice = (await prisma.invoice.findUnique({
      where: { id },
    })) as InvoiceRecord | null

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update the invoice status
    await prisma.invoice.update({
      where: { id },
      data: { status: "approved" },
    })

    console.log(`[INVOICE APPROVAL] Invoice ${id} approved for ${invoice.customerEmail}`)

    // Check for affiliate cookie in metadata or system settings
    let affiliateCode = null
    let metadata = {}

    try {
      metadata = JSON.parse(invoice.metadata || "{}")
      if (metadata && (metadata as any).affiliateCode) {
        affiliateCode = (metadata as any).affiliateCode
        console.log(`[AFFILIATE] Found affiliate code in metadata: ${affiliateCode}`)
      }
    } catch (e) {
      console.error(`[AFFILIATE] Error parsing metadata for invoice ${id}:`, e)
    }

    // If no affiliate code in metadata, check system settings
    if (!affiliateCode) {
      const affiliateCookieSetting = await prisma.systemSettings.findFirst({
        where: { key: `affiliate_cookie_${invoice.customerEmail}` },
      })

      if (affiliateCookieSetting) {
        affiliateCode = affiliateCookieSetting.value
        console.log(`[AFFILIATE] Found affiliate code in system settings: ${affiliateCode}`)
      }
    }

    // If we have an affiliate code, record the conversion
    if (affiliateCode) {
      console.log(`[AFFILIATE] Processing conversion for code: ${affiliateCode}`)

      // Find the affiliate link
      const affiliateLink = await prisma.affiliateLink.findFirst({
        where: { code: affiliateCode },
        include: { user: true },
      })

      if (!affiliateLink) {
        console.error(`[AFFILIATE] Invalid affiliate code: ${affiliateCode}`)
      } else {
        console.log(`[AFFILIATE] Valid affiliate code for user: ${affiliateLink.user.email}`)

        try {
          // Use raw SQL to create the conversion record
          await prisma.$executeRaw`
            INSERT INTO affiliate_conversions (
              link_id, invoice_id, amount, commission_amount, 
              status, customer_email, created_at, updated_at
            ) VALUES (
              ${affiliateLink.id}, ${id}, ${invoice.amount}, 
              ${invoice.amount * affiliateLink.commissionRate}, 
              'pending', ${invoice.customerEmail}, NOW(), NOW()
            )
          `

          console.log(`[AFFILIATE] Successfully recorded conversion for ${affiliateLink.user.email}`)
        } catch (error) {
          console.error(`[AFFILIATE] Error recording conversion:`, error)

          // Try an alternative approach if the first one fails
          try {
            // Get all affiliate cookies from system settings
            const allAffiliateCookies = await prisma.systemSettings.findMany({
              where: {
                key: {
                  startsWith: "affiliate_cookie_",
                },
              },
            })

            console.log(`[AFFILIATE] Found ${allAffiliateCookies.length} affiliate cookies in system`)
            console.log(`[AFFILIATE] Cookie keys: ${allAffiliateCookies.map((c: { key: string }) => c.key).join(", ")}`)

            // Check if our email is in the list
            const matchingCookie = allAffiliateCookies.find(
              (c: any) => c.key === `affiliate_cookie_${invoice.customerEmail}`,
            )

            if (matchingCookie) {
              console.log(`[AFFILIATE] Found matching cookie for ${invoice.customerEmail}: ${matchingCookie.value}`)

              // Try again with the matching cookie
              const retryAffiliateLink = await prisma.affiliateLink.findFirst({
                where: { code: matchingCookie.value },
                include: { user: true },
              })

              if (retryAffiliateLink) {
                await prisma.$executeRaw`
                  INSERT INTO affiliate_conversions (
                    link_id, invoice_id, amount, commission_amount, 
                    status, customer_email, created_at, updated_at
                  ) VALUES (
                    ${retryAffiliateLink.id}, ${id}, ${invoice.amount}, 
                    ${invoice.amount * retryAffiliateLink.commissionRate}, 
                    'pending', ${invoice.customerEmail}, NOW(), NOW()
                  )
                `

                console.log(
                  `[AFFILIATE] Successfully recorded conversion on retry for ${retryAffiliateLink.user.email}`,
                )
              }
            }
          } catch (retryError) {
            console.error(`[AFFILIATE] Error in retry approach:`, retryError)
          }
        }
      }
    } else {
      console.log(`[AFFILIATE] No affiliate code found for ${invoice.customerEmail}`)
    }

    return NextResponse.json({
      success: true,
      message: "Invoice approved successfully",
      affiliateProcessed: !!affiliateCode,
    })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

