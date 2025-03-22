import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { storeAffiliateCookie } from "@/lib/store-affiliate-cookie"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { email, name, amount, items } = data

    if (!email || !name || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: name,
        customerEmail: email,
        amount: Number.parseFloat(amount),
        status: "pending",
        items: JSON.stringify(items || []),
      },
    })

    // Check for affiliate cookie - properly await the cookies() call
    const cookieStore = await cookies()
    const affiliateCookie = cookieStore.get("affiliate")

    console.log("Checkout for email:", email, "Affiliate cookie:", affiliateCookie?.value)

    if (affiliateCookie?.value && email) {
      // Store the affiliate cookie in the database
      await storeAffiliateCookie(email, affiliateCookie.value)

      // Double-check that it was stored
      const storedCookie = await prisma.systemSettings.findFirst({
        where: {
          key: `affiliate_cookie_${email}`,
        },
      })

      console.log("Verified stored cookie:", storedCookie)
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

