import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("API: Fetching invoice with ID:", params.id)

    // Use select to only fetch the fields we need
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        customerCompany: true,
        customerAddress: true,
        customerCity: true,
        customerState: true,
        customerZip: true,
        customerCountry: true,
        amount: true,
        status: true,
        items: true,
        paymentReceipt: true,
        paymentDate: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    })

    if (!invoice) {
      console.log("API: Invoice not found")
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if this invoice is for a template purchase by parsing the items JSON
    let templateInfo = null
    try {
      const items = JSON.parse(invoice.items)
      // Check if any item has a type of "template"
      const templateItem = Array.isArray(items) ? items.find((item) => item.type === "template") : null

      if (templateItem) {
        templateInfo = {
          id: templateItem.templateId,
          name: templateItem.name,
          description: templateItem.description,
          price: templateItem.price,
        }
      }
    } catch (e) {
      console.error("Error parsing invoice items:", e)
    }

    console.log("API: Invoice found")
    return NextResponse.json({
      invoice,
      templateInfo,
    })
  } catch (error: any) {
    console.error("API: Error fetching invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Add PATCH method to update invoice with receipt URL
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id
    const data = await req.json()

    // Validate the request
    if (!data.paymentReceipt) {
      return NextResponse.json({ error: "Payment receipt URL is required" }, { status: 400 })
    }

    // Update the invoice with the receipt URL
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: data.paymentReceipt,
      },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("API: Error updating invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

