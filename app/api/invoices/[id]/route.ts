import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("API: Fetching invoice with ID:", params.id)

    // Use select to only fetch the fields we need
    const invoice = await prisma.invoice.findUnique({
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
    let parsedItems = null

    try {
      if (typeof invoice.items === "string") {
        parsedItems = JSON.parse(invoice.items)
      } else {
        parsedItems = invoice.items
      }

      // Check for template indicators
      const isTemplateInvoice =
        (parsedItems && parsedItems.isTemplateInvoice) ||
        (parsedItems && parsedItems.templateName) ||
        (Array.isArray(parsedItems) && parsedItems.some((item) => item.type === "template")) ||
        (typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template"))

      if (isTemplateInvoice) {
        // Extract template info
        let templateName = "Unknown Template"
        let templateId = ""

        // Try to get template name from various formats
        if (parsedItems.templateName) {
          templateName = parsedItems.templateName
        } else if (Array.isArray(parsedItems) && parsedItems.length > 0 && parsedItems[0].tier) {
          templateName = parsedItems[0].tier
        } else if (parsedItems["0"] && parsedItems["0"].tier) {
          templateName = parsedItems["0"].tier
        }

        // Try to get template ID
        if (parsedItems.templateId) {
          templateId = parsedItems.templateId
        } else if (Array.isArray(parsedItems) && parsedItems.length > 0 && parsedItems[0].templateId) {
          templateId = parsedItems[0].templateId
        }

        templateInfo = {
          id: templateId || invoice.id,
          name: templateName,
          description: `${templateName} template`,
          price: parsedItems.price || (Array.isArray(parsedItems) && parsedItems.length > 0 ? parsedItems[0].price : 0),
        }
      }
    } catch (e) {
      console.error("Error parsing invoice items:", e)
    }

    console.log("API: Invoice found, template info:", templateInfo)
    return NextResponse.json({
      invoice,
      templateInfo,
    })
  } catch (error: any) {
    console.error("API: Error fetching invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

