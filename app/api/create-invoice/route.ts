import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    // Parse request body
    let body
    try {
      body = await req.json()
      console.log("Creating invoice with data:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request data", message: "Could not parse the request body" },
        { status: 400 },
      )
    }

    const { customer, items, total, paymentReceipt } = body

    // Validate required fields
    if (!paymentReceipt) {
      return NextResponse.json({ error: "Payment receipt is required" }, { status: 400 })
    }

    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json({ error: "Customer information is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    if (total === undefined || total === null) {
      return NextResponse.json({ error: "Total amount is required" }, { status: 400 })
    }

    // Generate invoice number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const invoiceNumber = `INV-${year}${month}-${Math.floor(1000 + Math.random() * 9000)}`

    // Process items to ensure they're in the correct format
    const safeItems = items.map((item: any) => ({
      id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tier: item.tier || "STANDARD",
      price: Number(item.price) || 0,
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
    }))

    // Convert amount to a number
    const amount = typeof total === "string" ? Number.parseFloat(total) : Number(total)

    // Create the invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        amount,
        status: "pending",
        items: JSON.stringify(safeItems),
        paymentReceipt: paymentReceipt,
        // Add optional fields only if they exist
        ...(customer.phone && { customerPhone: customer.phone }),
        ...(customer.company && { customerCompany: customer.company }),
        ...(customer.address && { customerAddress: customer.address }),
        ...(customer.city && { customerCity: customer.city }),
        ...(customer.state && { customerState: customer.state }),
        ...(customer.zip && { customerZip: customer.zip }),
        ...(customer.country && { customerCountry: customer.country }),
      },
    })

    console.log("Invoice created successfully:", invoice.id)

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        message: error.message,
        code: error.code,
        meta: error.meta,
      },
      { status: 500 },
    )
  }
}

