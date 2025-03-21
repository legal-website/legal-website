import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Define an interface for the invoice item to avoid TypeScript errors
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee: number | null
  state: string | null
  discount: number | null
  templateId: string | null
  type: string | null
  name: string
  description: string | null
  isTemplateInvoice?: boolean // Make this optional
}

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
    // IMPORTANT: Preserve the original price from the items
    const safeItems: InvoiceItem[] = items.map((item: any) => ({
      id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tier: item.tier || "STANDARD",
      price: Number(item.price) || 0, // Ensure we're using the actual price from the item
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
      templateId: item.templateId || null, // Add templateId if it exists
      type: item.templateId ? "template" : item.type || null, // Set type to "template" if templateId exists
      name: item.name || item.tier || "Unknown Item", // Add item name for better identification
      description: item.description || null, // Add description if available
    }))

    // Check if this is a template invoice
    const isTemplateInvoice = safeItems.some(
      (item) =>
        item.type === "template" ||
        (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
    )

    // If this is a template invoice, add a flag to make it easier to identify
    if (isTemplateInvoice) {
      console.log("This is a template invoice")
      // Add isTemplateInvoice flag to each item that is a template
      safeItems.forEach((item) => {
        if (
          item.type === "template" ||
          (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template"))
        ) {
          item.isTemplateInvoice = true
        }
      })
    }

    // Convert amount to a number - use the provided total which should match the template price
    const amount = typeof total === "string" ? Number.parseFloat(total) : Number(total)

    // Create the invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: isTemplateInvoice ? `TEMPLATE-${invoiceNumber}` : invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        amount, // Use the correct amount from the request
        status: "pending",
        items: JSON.stringify(safeItems), // Store the items with correct prices
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

