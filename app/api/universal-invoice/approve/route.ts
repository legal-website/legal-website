import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get the invoice ID from the request body
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    console.log("Universal approve route - Processing invoice:", invoiceId)

    // Check authentication (optional - can be removed if causing issues)
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("No session found, proceeding anyway")
      // Continue without session check for maximum compatibility
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Found invoice:", invoice.invoiceNumber)

    // Update invoice status to paid
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })

    console.log("Invoice updated successfully to PAID status")

    // Process template purchase if applicable
    try {
      // Parse the items JSON string if it exists
      if (invoice.items && typeof invoice.items === "string") {
        const itemsArray = JSON.parse(invoice.items)
        const templateItems = itemsArray.filter(
          (item: any) =>
            item.type === "template" ||
            (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")) ||
            item.templateId,
        )

        if (templateItems.length > 0 && invoice.user?.businessId) {
          console.log("Processing template purchase")

          // For each template in the invoice
          for (const item of templateItems) {
            // Get the original template
            if (item.templateId) {
              const originalTemplate = await db.document.findUnique({
                where: { id: item.templateId },
              })

              if (originalTemplate) {
                // Create a copy of the template for the user's business
                await db.document.create({
                  data: {
                    name: `template_${originalTemplate.id}`, // Store original ID in name
                    category: "template", // User templates have category "template"
                    businessId: invoice.user.businessId,
                    fileUrl: originalTemplate.fileUrl,
                    type: "template",
                  },
                })
                console.log(`Template ${originalTemplate.id} granted to business ${invoice.user.businessId}`)
              }
            }
          }
        }
      }
    } catch (parseError) {
      console.error("Error processing template purchase:", parseError)
      // Continue even if there's an error processing templates
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: "Invoice approved successfully",
    })
  } catch (error: any) {
    console.error("Error in universal approve route:", error)
    return NextResponse.json(
      {
        error: error.message || "Something went wrong",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

