import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { storeAffiliateCookie } from "@/lib/store-affiliate-cookie"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { email, name, amount, items, affiliateCode } = data

    if (!email || !name || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: name,
        customerEmail: email,
        amount: Number.parseFloat(amount),
        status: "pending",
        items: JSON.stringify(items || []),
      },
    })

    // Check for affiliate code from the request (sent from client-side)
    if (affiliateCode && email) {
      // Store the affiliate code in the database
      await storeAffiliateCookie(email, affiliateCode)
      console.log(`Stored affiliate code ${affiliateCode} for user ${email}`)
    } else {
      // Fallback to cookie if no code was passed in the request
      try {
        const cookieStore = cookies()
        // TypeScript fix: Use type assertion to tell TypeScript this is not a Promise
        const affiliateCookie = (cookieStore as any).get("affiliate")

        if (affiliateCookie && email) {
          // Store the affiliate cookie in the database
          await storeAffiliateCookie(email, affiliateCookie.value)
          console.log(`Stored affiliate code ${affiliateCookie.value} from cookie for user ${email}`)
        }
      } catch (cookieError) {
        console.error("Error accessing cookies:", cookieError)
        // Continue execution even if cookie handling fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: "Invoice created successfully. Please upload payment receipt.",
    })
  } catch (error: any) {
    console.error("Error processing checkout:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

