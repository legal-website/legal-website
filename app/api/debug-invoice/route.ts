import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Allow all origins for testing
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
    // Step 1: Log the raw request
    console.log("Received request to debug-invoice endpoint")

    // Step 2: Parse the request body and log it
    let body
    try {
      body = await req.json()
      console.log("Request body parsed successfully:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          error: "Failed to parse request body",
          message: (parseError as Error).message,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // Step 3: Validate the required fields
    const { customer, items, total } = body

    const validationErrors = []
    if (!customer) validationErrors.push("Customer is required")
    if (!items || items.length === 0) validationErrors.push("Items are required")
    if (!total) validationErrors.push("Total is required")

    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors)
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // Step 4: Test database connection
    try {
      const dbTest = await db.invoice.count()
      console.log("Database connection test successful. Invoice count:", dbTest)
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: (dbError as Error).message,
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    // Step 5: Prepare the invoice data
    const invoiceNumber = `INV-DEBUG-${Date.now().toString().slice(-6)}`

    // Ensure items is properly formatted
    const safeItems = items.map((item: any) => ({
      id: item.id || `item-${Date.now()}`,
      tier: item.tier || "STANDARD",
      price: Number(item.price) || 0,
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
    }))

    const itemsString = JSON.stringify(safeItems)
    console.log("Prepared items string:", itemsString)

    // Step 6: Create a minimal invoice to test database insertion
    try {
      const minimalInvoice = await db.invoice.create({
        data: {
          invoiceNumber,
          customerName: customer.name || "Test Customer",
          customerEmail: customer.email || "test@example.com",
          amount: typeof total === "string" ? Number.parseFloat(total) : Number(total),
          status: "pending",
          items: itemsString,
        },
      })

      console.log("Minimal invoice created successfully:", minimalInvoice)

      return NextResponse.json(
        {
          success: true,
          message: "Invoice created successfully",
          invoice: minimalInvoice,
        },
        {
          headers: corsHeaders,
        },
      )
    } catch (createError: any) {
      console.error("Failed to create invoice:", createError)

      // Check for specific Prisma errors
      if (createError.code) {
        console.log("Prisma error code:", createError.code)
      }

      return NextResponse.json(
        {
          error: "Failed to create invoice",
          message: createError.message,
          code: createError.code,
          meta: createError.meta,
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }
  } catch (error: any) {
    console.error("Unhandled error in debug-invoice endpoint:", error)
    return NextResponse.json(
      {
        error: "Unhandled server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
}

