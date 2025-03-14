import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { InvoiceItem } from "@/lib/prisma-types"

// Define a type for the Document model
interface Document {
  id: string
  name: string
  category: string
  type: string
  fileUrl: string
  businessId: string
  createdAt?: Date
  updatedAt?: Date
}

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

    console.log(`Processing template invoice ${invoiceId} with status ${status}`)

    // Get the invoice with user details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log(`Found invoice: ${invoice.invoiceNumber} for user ${invoice.userId}`)

    // Update the invoice status
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paymentDate: status === "paid" ? new Date() : undefined,
      },
    })

    console.log(`Updated invoice status to ${status}`)

    // If the invoice is being approved (status = "paid"), handle template access
    if (status === "paid" && invoice.userId) {
      try {
        console.log(`Processing template access for user ${invoice.userId}`)

        // Get user's business ID
        const user = await db.user.findUnique({
          where: { id: invoice.userId },
          include: { business: true },
        })

        if (!user || !user.business) {
          console.log(`User ${invoice.userId} has no business, cannot grant template access`)
          return NextResponse.json({
            success: true,
            invoice: updatedInvoice,
            warning: "User has no business, template access not granted",
          })
        }

        const businessId = user.business.id
        console.log(`User's business ID: ${businessId}`)

        // Parse the invoice items
        console.log(
          `Invoice items (raw): ${typeof invoice.items === "string" ? invoice.items : JSON.stringify(invoice.items)}`,
        )

        let invoiceItems: InvoiceItem[] = []
        try {
          const parsedItems = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items

          invoiceItems = Array.isArray(parsedItems) ? parsedItems : [parsedItems]
          console.log(`Parsed invoice items: ${JSON.stringify(invoiceItems)}`)
        } catch (e) {
          console.error("Error parsing invoice items:", e)
          // If parsing fails, try to check if it contains "template" as a string
          if (
            typeof invoice.items === "string" &&
            (invoice.items.toLowerCase().includes("template") ||
              invoice.items.toLowerCase().includes("istemplateinvoice"))
          ) {
            console.log("Template invoice detected, but items couldn't be parsed")

            // Create a dummy item for template detection
            invoiceItems = [
              {
                type: "template",
                tier: "Template Purchase",
                price: invoice.amount,
              },
            ]
          }
        }

        // Find template items
        const templateItems = invoiceItems.filter(
          (item) =>
            item.type === "template" ||
            (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
        )

        console.log(`Template items found: ${JSON.stringify(templateItems)}`)

        if (templateItems.length === 0) {
          console.log("No template items found in invoice, checking if entire invoice is for templates")

          // Check if the entire invoice might be for templates
          if (
            typeof invoice.items === "string" &&
            (invoice.items.toLowerCase().includes("template") ||
              invoice.invoiceNumber.toLowerCase().includes("template"))
          ) {
            console.log("Invoice appears to be for templates based on text content")

            // Create a dummy item for template detection
            templateItems.push({
              type: "template",
              tier: "Template Purchase",
              price: invoice.amount,
            })
          }
        }

        if (templateItems.length === 0) {
          console.log("No template items found in invoice, cannot grant template access")
          return NextResponse.json({
            success: true,
            invoice: updatedInvoice,
            warning: "No template items found in invoice",
          })
        }

        // Get all master templates
        const masterTemplates = (await db.document.findMany({
          where: {
            type: "template",
          },
        })) as Document[]

        console.log(`Found ${masterTemplates.length} master templates`)

        // For each template item, create a document record for the user
        let templatesUnlocked = 0
        for (const item of templateItems) {
          console.log(`Processing template item: ${JSON.stringify(item)}`)

          // Find matching template by name/tier or by checking all templates
          let matchingTemplates: Document[] = []

          if (item.tier) {
            // Try to find by tier name
            matchingTemplates = masterTemplates.filter((template) =>
              template.name.toLowerCase().includes(item.tier?.toLowerCase() || ""),
            )
            console.log(`Found ${matchingTemplates.length} templates matching tier: ${item.tier}`)
          }

          // If no matches by tier, try to match by templateId
          if (matchingTemplates.length === 0 && item.templateId) {
            matchingTemplates = masterTemplates.filter((template) => template.id === item.templateId)
            console.log(`Found ${matchingTemplates.length} templates matching templateId: ${item.templateId}`)
          }

          // If still no matches, unlock all templates (this is a fallback)
          if (matchingTemplates.length === 0 && masterTemplates.length > 0) {
            console.log("No specific template matches found, unlocking all templates")
            matchingTemplates = masterTemplates
          }

          for (const matchingTemplate of matchingTemplates) {
            console.log(`Processing matching template: ${matchingTemplate.id} - ${matchingTemplate.name}`)

            // Check if the user already has this template
            const existingTemplate = await db.document.findFirst({
              where: {
                businessId: businessId,
                name: { contains: `template_${matchingTemplate.id}` },
              },
            })

            if (existingTemplate) {
              console.log(`User already has template ${matchingTemplate.id}`)
              continue
            }

            // Create a copy of the template for the user
            try {
              const newTemplate = await db.document.create({
                data: {
                  name: `template_${matchingTemplate.id}_${matchingTemplate.name}`,
                  category: "template",
                  type: "purchased_template",
                  fileUrl: matchingTemplate.fileUrl,
                  businessId: businessId,
                },
              })

              console.log(
                `Template ${matchingTemplate.id} unlocked for user ${invoice.userId}, created document ${newTemplate.id}`,
              )
              templatesUnlocked++
            } catch (error) {
              console.error(`Error creating template document: ${error}`)
            }
          }
        }

        console.log(`Unlocked ${templatesUnlocked} templates for user ${invoice.userId}`)

        return NextResponse.json({
          success: true,
          invoice: updatedInvoice,
          templatesUnlocked,
        })
      } catch (e) {
        console.error("Error handling template access:", e)
        // Don't fail the request if template handling fails
        return NextResponse.json({
          success: true,
          invoice: updatedInvoice,
          error: `Error handling template access: ${e}`,
        })
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

