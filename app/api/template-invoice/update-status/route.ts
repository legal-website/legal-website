import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { InvoiceItem } from "@/lib/prisma-types"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { invoiceId, status } = body

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    if (!status || !["paid", "pending", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 })
    }

    // Find the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update the invoice status
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        // If status is paid, set payment date
        ...(status === "paid" ? { paymentDate: new Date() } : {}),
      },
    })

    // If the invoice is now paid, grant template access to the user
    if (status === "paid" && invoice.userId && invoice.user?.businessId) {
      try {
        // Parse the items to find template information
        let items: InvoiceItem[] = []
        try {
          items = typeof invoice.items === "string" ? JSON.parse(invoice.items) : (invoice.items as any)
        } catch (e) {
          console.error("Error parsing invoice items:", e)
        }

        // Find template items
        const templateItems = Array.isArray(items)
          ? items.filter(
              (item) =>
                item.type === "template" ||
                (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
            )
          : []

        console.log("Template items found:", templateItems)

        // For each template item, create a document record for the user
        for (const item of templateItems) {
          if (item.templateId) {
            // Find the original template document
            const originalTemplate = await db.document.findUnique({
              where: { id: item.templateId },
            })

            if (originalTemplate) {
              // Create a copy of the template for the user's business
              await db.document.create({
                data: {
                  name: `template_${item.templateId}`, // Prefix with template_ to identify it as a purchased template
                  category: "template",
                  type: "template",
                  fileUrl: originalTemplate.fileUrl,
                  businessId: invoice.user.businessId,
                },
              })

              console.log(`Template ${item.templateId} unlocked for business ${invoice.user.businessId}`)
            }
          }
        }
      } catch (error) {
        console.error("Error granting template access:", error)
        // Continue with the response even if template access grant fails
      }
    }

    // Log the update for debugging
    console.log(`Template invoice ${invoiceId} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("Error updating template invoice status:", error)
    return NextResponse.json({ error: "Failed to update invoice status", message: error.message }, { status: 500 })
  }
}

