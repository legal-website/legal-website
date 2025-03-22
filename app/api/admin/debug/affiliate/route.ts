import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    console.log(`[AFFILIATE DEBUG] Checking affiliate status for email: ${email}`)

    // Get all system settings related to this email
    const affiliateCookieSetting = await prisma.systemSettings.findFirst({
      where: { key: `affiliate_cookie_${email}` },
    })

    // Get all invoices for this email
    const invoices = await prisma.invoice.findMany({
      where: { customerEmail: email },
    })

    // Get current cookie
    const cookieStore = await cookies()
    const currentAffiliateCookie = cookieStore.get("affiliate")

    // Check for conversions
    const conversions = await prisma.$queryRaw`
      SELECT * FROM affiliate_conversions 
      WHERE customer_email = ${email}
    `

    // Format invoice data
    const formattedInvoices = invoices.map((invoice: any) => {
      let metadata = {}
      try {
        metadata = JSON.parse(invoice.metadata || "{}")
      } catch (e) {
        console.error(`Error parsing metadata for invoice ${invoice.id}:`, e)
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        metadata,
      }
    })

    return NextResponse.json({
      email,
      currentCookie: currentAffiliateCookie?.value || null,
      storedCookie: affiliateCookieSetting?.value || null,
      invoices: formattedInvoices,
      conversions: conversions || [],
    })
  } catch (error: any) {
    console.error("Error in affiliate debug:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

