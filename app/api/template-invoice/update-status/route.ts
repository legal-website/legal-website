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
    const { invoiceId, status, specificTemplateId } = body

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Invoice ID and status are required" }, { status: 400 })
    }

    console.log(`Processing template invoice ${invoiceId} with status ${status}`)
    if (specificTemplateId) {
      console.log(`Specific template ID provided: ${specificTemplateId}`)
    }

    // Get the invoice with user details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log(`Found invoice: ${invoice.invoiceNumber} for user ${invoice.userId}`)
    console.log(`Raw invoice items: ${JSON.stringify(invoice.items)}`)

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

        // Get all master templates
        const masterTemplates = (await db.document.findMany({
          where: {
            type: "template",
          },
        })) as Document[]

        console.log(`Found ${masterTemplates.length} master templates:`)
        masterTemplates.forEach((template) => {
          console.log(`- ${template.id}: ${template.name}`)
        })

        // Get user's existing templates
        const userTemplates = await db.document.findMany({
          where: {
            businessId: businessId,
            type: "purchased_template",
          },
        })

        console.log(`User has ${userTemplates.length} existing templates`)

        // Create a map of template IDs that the user already has
        const userTemplateMap = new Map()
        userTemplates.forEach((template) => {
          // Extract the original template ID from the name (format: template_<id>_<name>)
          const match = template.name.match(/^template_([^_]+)/)
          if (match && match[1]) {
            userTemplateMap.set(match[1], true)
            console.log(`User already has template: ${match[1]}`)
          }
        })

        // If a specific template ID was provided, use that
        if (specificTemplateId) {
          const template = masterTemplates.find((t) => t.id === specificTemplateId)

          if (!template) {
            return NextResponse.json(
              {
                success: false,
                error: `Template with ID ${specificTemplateId} not found`,
              },
              { status: 404 },
            )
          }

          // Check if user already has this template
          if (userTemplateMap.has(specificTemplateId)) {
            console.log(`User already has template ${specificTemplateId}, skipping`)
            return NextResponse.json({
              success: true,
              invoice: updatedInvoice,
              message: `User already has template ${specificTemplateId}`,
            })
          }

          // Create a copy of the template for the user
          try {
            const newTemplate = await db.document.create({
              data: {
                name: `template_${template.id}_${template.name}`,
                category: "template",
                type: "purchased_template",
                fileUrl: template.fileUrl,
                businessId: businessId,
              },
            })

            console.log(
              `Template ${template.id} unlocked for user ${invoice.userId}, created document ${newTemplate.id}`,
            )

            return NextResponse.json({
              success: true,
              invoice: updatedInvoice,
              templatesUnlocked: 1,
              unlockedTemplate: template.name,
            })
          } catch (error) {
            console.error(`Error creating template document: ${error}`)
            return NextResponse.json(
              {
                success: false,
                error: `Error creating template document: ${error}`,
              },
              { status: 500 },
            )
          }
        }

        // Try to parse invoice items
        let invoiceItems: InvoiceItem[] = []
        let templateKeywords: string[] = []

        try {
          if (typeof invoice.items === "string") {
            // Try to parse as JSON
            try {
              const parsedItems = JSON.parse(invoice.items)
              invoiceItems = Array.isArray(parsedItems) ? parsedItems : [parsedItems]
              console.log(`Successfully parsed invoice items: ${JSON.stringify(invoiceItems)}`)
            } catch (e) {
              console.log(`Failed to parse invoice items as JSON: ${e}`)

              // If parsing fails, extract keywords from the string
              const itemsStr = invoice.items.toLowerCase()
              console.log(`Treating invoice items as string: ${itemsStr}`)

              // Extract potential template names or keywords
              const words = itemsStr.split(/\s+/)
              templateKeywords = words.filter(
                (word) =>
                  word.length > 3 && !["template", "invoice", "item", "price", "quantity", "total"].includes(word),
              )

              console.log(`Extracted keywords from invoice items: ${templateKeywords.join(", ")}`)
            }
          } else if (invoice.items) {
            // Items is already an object
            invoiceItems = Array.isArray(invoice.items) ? invoice.items : [invoice.items]
            console.log(`Invoice items is already an object: ${JSON.stringify(invoiceItems)}`)
          }
        } catch (e) {
          console.error(`Error processing invoice items: ${e}`)
        }

        // Extract template information from invoice
        let potentialTemplateNames: string[] = []

        // 1. Check invoice number for template info
        if (invoice.invoiceNumber.toLowerCase().includes("template")) {
          console.log(`Invoice number contains 'template': ${invoice.invoiceNumber}`)
          potentialTemplateNames.push(invoice.invoiceNumber)
        }

        // 2. Check customer name for template info
        if (invoice.customerName.toLowerCase().includes("template")) {
          console.log(`Customer name contains 'template': ${invoice.customerName}`)
          potentialTemplateNames.push(invoice.customerName)
        }

        // 3. Add any template keywords from invoice items
        potentialTemplateNames = [...potentialTemplateNames, ...templateKeywords]

        // 4. Check parsed invoice items for template info
        const templateItems = invoiceItems.filter(
          (item) =>
            item.type === "template" ||
            (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
        )

        if (templateItems.length > 0) {
          console.log(`Found ${templateItems.length} template items in invoice`)
          templateItems.forEach((item) => {
            if (item.tier) potentialTemplateNames.push(item.tier)
            if (item.templateId) potentialTemplateNames.push(item.templateId)
          })
        }

        console.log(`Potential template names: ${potentialTemplateNames.join(", ")}`)

        // If we have no potential template names, try to find a template that the user doesn't already have
        if (potentialTemplateNames.length === 0) {
          console.log(`No potential template names found, looking for templates user doesn't have`)

          // Find templates the user doesn't already have
          const availableTemplates = masterTemplates.filter((template) => !userTemplateMap.has(template.id))

          if (availableTemplates.length > 0) {
            console.log(`Found ${availableTemplates.length} templates user doesn't have`)

            // Use the first available template
            const templateToUnlock = availableTemplates[0]
            console.log(`Using template: ${templateToUnlock.id} - ${templateToUnlock.name}`)

            // Create a copy of the template for the user
            try {
              const newTemplate = await db.document.create({
                data: {
                  name: `template_${templateToUnlock.id}_${templateToUnlock.name}`,
                  category: "template",
                  type: "purchased_template",
                  fileUrl: templateToUnlock.fileUrl,
                  businessId: businessId,
                },
              })

              console.log(
                `Template ${templateToUnlock.id} unlocked for user ${invoice.userId}, created document ${newTemplate.id}`,
              )

              return NextResponse.json({
                success: true,
                invoice: updatedInvoice,
                templatesUnlocked: 1,
                unlockedTemplate: templateToUnlock.name,
              })
            } catch (error) {
              console.error(`Error creating template document: ${error}`)
              return NextResponse.json(
                {
                  success: false,
                  error: `Error creating template document: ${error}`,
                },
                { status: 500 },
              )
            }
          } else {
            console.log(`User already has all available templates`)
            return NextResponse.json({
              success: true,
              invoice: updatedInvoice,
              message: "User already has all available templates",
            })
          }
        }

        // Find matching templates based on potential template names
        let matchingTemplates: Document[] = []

        for (const name of potentialTemplateNames) {
          // Skip empty names
          if (!name) continue

          const nameStr = String(name).toLowerCase()

          // Try to find exact matches first
          const exactMatches = masterTemplates.filter((template) => template.name.toLowerCase() === nameStr)

          if (exactMatches.length > 0) {
            console.log(`Found ${exactMatches.length} exact matches for name: ${nameStr}`)
            matchingTemplates = [...matchingTemplates, ...exactMatches]
          } else {
            // Try partial matches
            const partialMatches = masterTemplates.filter((template) => template.name.toLowerCase().includes(nameStr))

            if (partialMatches.length > 0) {
              console.log(`Found ${partialMatches.length} partial matches for name: ${nameStr}`)
              matchingTemplates = [...matchingTemplates, ...partialMatches]
            }
          }
        }

        // Remove duplicates
        matchingTemplates = Array.from(new Map(matchingTemplates.map((template) => [template.id, template])).values())

        console.log(`Found ${matchingTemplates.length} unique matching templates`)

        // Filter out templates the user already has
        const templatesToUnlock = matchingTemplates.filter((template) => !userTemplateMap.has(template.id))

        console.log(`Found ${templatesToUnlock.length} templates to unlock (after filtering out already owned)`)

        // If we still have no templates to unlock, find a template the user doesn't have
        if (templatesToUnlock.length === 0) {
          console.log(`No templates to unlock, looking for any template user doesn't have`)

          // Find templates the user doesn't already have
          const availableTemplates = masterTemplates.filter((template) => !userTemplateMap.has(template.id))

          if (availableTemplates.length > 0) {
            console.log(`Found ${availableTemplates.length} templates user doesn't have`)

            // Use the first available template
            const templateToUnlock = availableTemplates[0]
            console.log(`Using template: ${templateToUnlock.id} - ${templateToUnlock.name}`)

            // Create a copy of the template for the user
            try {
              const newTemplate = await db.document.create({
                data: {
                  name: `template_${templateToUnlock.id}_${templateToUnlock.name}`,
                  category: "template",
                  type: "purchased_template",
                  fileUrl: templateToUnlock.fileUrl,
                  businessId: businessId,
                },
              })

              console.log(
                `Template ${templateToUnlock.id} unlocked for user ${invoice.userId}, created document ${newTemplate.id}`,
              )

              return NextResponse.json({
                success: true,
                invoice: updatedInvoice,
                templatesUnlocked: 1,
                unlockedTemplate: templateToUnlock.name,
              })
            } catch (error) {
              console.error(`Error creating template document: ${error}`)
              return NextResponse.json(
                {
                  success: false,
                  error: `Error creating template document: ${error}`,
                },
                { status: 500 },
              )
            }
          } else {
            console.log(`User already has all available templates`)
            return NextResponse.json({
              success: true,
              invoice: updatedInvoice,
              message: "User already has all available templates",
            })
          }
        }

        // Unlock the matching templates
        let templatesUnlocked = 0
        const unlockedTemplateNames: string[] = []

        for (const template of templatesToUnlock) {
          console.log(`Processing template: ${template.id} - ${template.name}`)

          // Create a copy of the template for the user
          try {
            const newTemplate = await db.document.create({
              data: {
                name: `template_${template.id}_${template.name}`,
                category: "template",
                type: "purchased_template",
                fileUrl: template.fileUrl,
                businessId: businessId,
              },
            })

            console.log(
              `Template ${template.id} unlocked for user ${invoice.userId}, created document ${newTemplate.id}`,
            )
            templatesUnlocked++
            unlockedTemplateNames.push(template.name)
          } catch (error) {
            console.error(`Error creating template document: ${error}`)
          }
        }

        console.log(`Unlocked ${templatesUnlocked} templates for user ${invoice.userId}`)

        return NextResponse.json({
          success: true,
          invoice: updatedInvoice,
          templatesUnlocked,
          unlockedTemplates: unlockedTemplateNames,
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

