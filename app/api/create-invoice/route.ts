import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db" // Import the db instance

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customer, items, total } = body

    if (!customer) {
      return new NextResponse("Customer is required", { status: 400 })
    }

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 })
    }

    if (!total) {
      return new NextResponse("Total is required", { status: 400 })
    }

    const invoiceNumber = uuidv4()

    // Make sure items is serializable
    const safeItems = items.map((item: any) => ({
      id: item.id,
      tier: item.tier,
      price: Number(item.price),
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
    }))

    const itemsJson = safeItems

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
        amount: typeof total === "string" ? Number.parseFloat(total) : Number(total),
        status: "pending",
        items: JSON.stringify(itemsJson), // Convert items array to string
      },
    })

    return NextResponse.json(invoice, {
      headers: corsHeaders,
    })
  } catch (error) {
    console.log("[CREATE_INVOICE_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

