import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { InvoiceItem } from "@/lib/prisma-types"

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { invoiceId, status } = body

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Invoice ID and status are required" }, { status: 400 })
    }

    // Get the invoice
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
        paymentDate: status === "paid" ? new Date() : undefined,
      },
    })

    // If the invoice is being approved (status = "paid"), handle template access
    if (status === "paid" && invoice.userId && invoice.user?.businessId) {
      try {
        // Parse the invoice items
        let invoiceItems: InvoiceItem[] = []
        try {
          const parsedItems = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items

          invoiceItems = Array.isArray(parsedItems) ? parsedItems : [parsedItems]
        } catch (e) {
          console.error("Error parsing invoice items:", e)
          // If parsing fails, try to check if it contains "template" as a string
          if (
            typeof invoice.items === "string" &&
            (invoice.items.toLowerCase().includes("template") ||
              invoice.items.toLowerCase().includes("istemplateinvoice"))
          ) {
            // This is likely a template invoice, but we can't parse the items
            console.log("Template invoice detected, but items couldn't be parsed")
          }
        }

        // Find template items
        const templateItems = invoiceItems.filter(
          (item) =>
            item.type === "template" ||
            (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
        )

        console.log("Template items found:", templateItems)

        // Get all master templates
        const masterTemplates = await db.document.findMany({
          where: {
            type: "template",
          },
        })

        // For each template item, create a document record for the user
        for (const item of templateItems) {
          // Find matching template by name/tier
          const matchingTemplate = masterTemplates.find((template) =>
            template.name.toLowerCase().includes(item.tier?.toLowerCase() || ""),
          )

          if (matchingTemplate) {
            // Check if the user already has this template
            const existingTemplate = await db.document.findFirst({
              where: {
                businessId: invoice.user.businessId,
                name: { startsWith: `template_${matchingTemplate.id}` },
              },
            })

            if (!existingTemplate) {
              // Create a copy of the template for the user
              await db.document.create({
                data: {
                  name: `template_${matchingTemplate.id}_${matchingTemplate.name}`,
                  category: "template",
                  type: "purchased_template",
                  fileUrl: matchingTemplate.fileUrl,
                  businessId: invoice.user.businessId,
                },
              })

              console.log(`Template ${matchingTemplate.id} unlocked for user ${invoice.userId}`)
            } else {
              console.log(`User already has template ${matchingTemplate.id}`)
            }
          } else {
            console.log(`No matching template found for item: ${JSON.stringify(item)}`)
          }
        }
      } catch (e) {
        console.error("Error handling template access:", e)
        // Don't fail the request if template handling fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("Error updating invoice status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while updating invoice status",
      },
      { status: 500 },
    )
  }
}

