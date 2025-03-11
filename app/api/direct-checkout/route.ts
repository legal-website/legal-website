import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// This is a simplified checkout endpoint with minimal logic
export async function POST(req: Request) {
  try {
    // Log the request
    console.log("Received direct checkout request")

    // Parse request body
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    // Extract data
    const { customer, items, total } = body

    // Generate invoice number
    const invoiceNumber = `INV-DIRECT-${Date.now()}`

    // Create invoice with minimal data
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: customer?.name || "Test Customer",
        customerEmail: customer?.email || "test@example.com",
        amount: Number(total) || 99.99,
        status: "pending",
        items: JSON.stringify(items || [{ id: "test", tier: "BASIC", price: 99.99 }]),
      },
    })

    console.log("Invoice created:", invoice.id)

    // Return a very simple response
    return NextResponse.json({
      invoice: invoice,
    })
  } catch (error: any) {
    console.error("Direct checkout error:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

