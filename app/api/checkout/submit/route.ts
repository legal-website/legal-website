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

    console.log(`Processing checkout for ${email} with amount ${amount}`)

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Check for affiliate cookie before creating the invoice
    const cookieStore = await cookies()
    const affiliateCookie = cookieStore.get("affiliate")

    console.log(`Checkout affiliate cookie for ${email}: ${affiliateCookie?.value || "none"}`)

    // Store metadata about this order
    const metadata: Record<string, any> = {}

    if (affiliateCookie?.value) {
      // Store the affiliate information in metadata
      metadata.affiliateCode = affiliateCookie.value

      // Store the affiliate cookie in the database immediately
      await storeAffiliateCookie(email, affiliateCookie.value)
      console.log(`Stored affiliate cookie for ${email}: ${affiliateCookie.value}`)

      // Verify storage
      const storedCookie = await prisma.systemSettings.findFirst({
        where: { key: `affiliate_cookie_${email}` },
      })

      if (storedCookie) {
        console.log(`Verified stored cookie for ${email}: ${storedCookie.value}`)
      } else {
        console.error(`Failed to store affiliate cookie for ${email}`)
      }
    }

    // Create invoice with metadata
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: name,
        customerEmail: email,
        amount: Number.parseFloat(amount),
        status: "pending",
        items: JSON.stringify(items || []),
        metadata: JSON.stringify(metadata),
      },
    })

    console.log(`Created invoice ${invoice.id} for ${email}`)

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

