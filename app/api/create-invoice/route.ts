import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer, items, total } = body

    if (!customer || !items || !total) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    console.log("Creating invoice with data:", { customer, items, total })

    // Generate invoice number (format: INV-YYYY-XXXX)
    const date = new Date()
    const year = date.getFullYear()

    // Get the count of invoices for this year to generate sequential number
    let invoiceCount = 0
    try {
      invoiceCount = await prisma.invoice.count({
        where: {
          invoiceNumber: {
            startsWith: `INV-${year}`,
          },
        },
      })
    } catch (countError) {
      console.error("Error counting invoices:", countError instanceof Error ? countError.message : String(countError))
      // Continue with count = 0 if there's an error
    }

    const sequentialNumber = (invoiceCount + 1).toString().padStart(4, "0")
    const invoiceNumber = `INV-${year}-${sequentialNumber}`

    // Safely serialize items to JSON
    let itemsJson
    try {
      // Make sure items is serializable
      const safeItems = items.map((item: { id: any; tier: any; price: any; stateFee: any; state: any; discount: any }) => ({
        id: item.id,
        tier: item.tier,
        price: Number(item.price),
        stateFee: item.stateFee ? Number(item.stateFee) : undefined,
        state: item.state || undefined,
        discount: item.discount ? Number(item.discount) : undefined,
      }))

      itemsJson = safeItems
    } catch (jsonError) {
      console.error("Error serializing items:", jsonError instanceof Error ? jsonError.message : String(jsonError))
      return NextResponse.json(
        {
          success: false,
          error: "Invalid items format",
        },
        { status: 400 },
      )
    }

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || null,
        customerCompany: customer.company || null,
        customerAddress: customer.address || null,
        customerCity: customer.city || null,
        customerState: customer.state || null,
        customerZip: customer.zip || null,
        customerCountry: customer.country || null,
        amount: typeof total === "string" ? Number.parseFloat(total) : Number(total),
        status: "pending",
        items: itemsJson,
      },
    })

    console.log("Invoice created successfully:", invoice.id)

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    })
  } catch (error: any) {
    console.error("Error creating invoice:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

