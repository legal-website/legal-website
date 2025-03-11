import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Received request body:", JSON.stringify(body, null, 2))

    const { customer, items, total } = body

    if (!customer) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400, headers: corsHeaders })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400, headers: corsHeaders })
    }

    if (!total) {
      return NextResponse.json({ error: "Total is required" }, { status: 400, headers: corsHeaders })
    }

    // Generate a more readable invoice number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const invoiceNumber = `INV-${year}${month}-${Math.floor(1000 + Math.random() * 9000)}`

    // Make sure items is serializable
    const safeItems = items.map((item: any) => ({
      id: item.id || uuidv4().substring(0, 8),
      tier: item.tier || "STANDARD",
      price: Number(item.price) || 0,
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
    }))

    // Convert amount to a number
    const amount = typeof total === "string" ? Number.parseFloat(total) : Number(total)

    console.log("Creating invoice with data:", {
      invoiceNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      amount,
      items: JSON.stringify(safeItems),
    })

    // Create the invoice
    const invoice = await db.invoice.create({
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
        amount,
        status: "pending",
        items: JSON.stringify(safeItems), // Convert items array to string
      },
    })

    console.log("Invoice created successfully:", invoice)

    return NextResponse.json(
      { success: true, invoice },
      {
        headers: corsHeaders,
      },
    )
  } catch (error: any) {
    console.error("[CREATE_INVOICE_ERROR]", error)

    // Return a more detailed error response
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        message: error.message,
        details: error.stack,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
}

