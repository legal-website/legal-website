import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Approving invoice:", params.id)

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      console.log("Unauthorized approval attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

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

    console.log("Invoice updated successfully")

    // Check if this is a template purchase
    try {
      // Parse the items JSON string if it exists
      if (invoice.items && typeof invoice.items === "string") {
        const itemsArray = JSON.parse(invoice.items)
        const templateItems = itemsArray.filter(
          (item: any) => item.type === "template" || (item.tier && item.tier.toLowerCase().includes("template")),
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

    // Send approval email
    try {
      await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)
      console.log("Approval email sent")
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

