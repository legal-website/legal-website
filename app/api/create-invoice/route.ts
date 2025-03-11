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
    // Parse the request body
    const body = await req.json()
    console.log("Received request body:", JSON.stringify(body, null, 2))

    const { customer, items, total } = body

    // Validate required fields
    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json(
        {
          error: "Customer with name and email is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Items array is required and must not be empty",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (total === undefined || total === null) {
      return NextResponse.json(
        {
          error: "Total amount is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // Generate invoice number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const invoiceNumber = `INV-${year}${month}-${Math.floor(1000 + Math.random() * 9000)}`

    // Process items to ensure they're in the correct format
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
      itemsCount: safeItems.length,
    })

    // Create the invoice with minimal required fields first
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        amount,
        status: "pending",
        items: JSON.stringify(safeItems),
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

    return NextResponse.json(
      {
        success: true,
        invoice,
      },
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
        code: error.code,
        meta: error.meta,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
}

