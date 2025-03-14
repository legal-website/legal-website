import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Define interfaces for better type safety
interface Document {
  id: string
  name: string
  category: string
  createdAt: Date
  updatedAt: Date
  businessId: string
  fileUrl: string
  type: string
}

interface InvoiceItem {
  id: string
  tier?: string
  price?: number
  stateFee?: number | null
  state?: string | null
  discount?: number | null
  templateId?: string | null
  type?: string | null
  name?: string
  description?: string | null
  isTemplateInvoice?: boolean
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    let body
    try {
      body = await req.json()
      console.log("Request body:", JSON.stringify(body, null, 2))
    } catch (e: any) {
      console.error("Error parsing request body:", e)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { invoiceId, status, specificTemplateId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Ensure status is provided and valid
    if (!status || !["paid", "pending", "cancelled"].includes(status)) {
      return NextResponse.json(
        {
          error: "Valid status is required (paid, pending, or cancelled)",
        },
        { status: 400 },
      )
    }

    console.log(
      `Processing template invoice ${invoiceId}, status: ${status}, specified templateId: ${specificTemplateId || "none"}`,
    )

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log(`Found invoice: ${invoice.invoiceNumber}, amount: ${invoice.amount}`)

    // Update the invoice status first
    try {
      const updatedInvoice = await db.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          paymentDate: status === "paid" ? new Date() : undefined,
        },
      })

      console.log(`Updated invoice status to ${status}`)

      // If status is not 'paid', we don't need to unlock templates
      if (status !== "paid") {
        return NextResponse.json({
          success: true,
          message: `Invoice status updated to ${status}`,
          invoice: updatedInvoice,
        })
      }
    } catch (e: any) {
      console.error("Error updating invoice status:", e)
      return NextResponse.json(
        {
          error: "Failed to update invoice status",
          details: e.message,
        },
        { status: 500 },
      )
    }

    // Get the user from the invoice
    const user = await db.user.findFirst({
      where: { email: invoice.customerEmail },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          email: invoice.customerEmail,
        },
        { status: 404 },
      )
    }

    // Check if user has a business
    if (!user.business || !user.business.id) {
      return NextResponse.json(
        {
          error: "User does not have a business",
          userId: user.id,
        },
        { status: 400 },
      )
    }

    const businessId = user.business.id
    console.log(`Found user: ${user.id}, businessId: ${businessId}`)

    // Get all templates
    const allTemplates = (await db.document.findMany({
      where: {
        type: "template",
      },
    })) as Document[]

    console.log(`Found ${allTemplates.length} templates`)

    // Get user's purchased templates
    const purchasedTemplates = (await db.document.findMany({
      where: {
        type: "purchased_template",
        businessId: businessId,
      },
    })) as Document[]

    console.log(`User already has ${purchasedTemplates.length} purchased templates`)

    // If a specific templateId was provided, use that
    if (specificTemplateId) {
      console.log(`Using specified templateId: ${specificTemplateId}`)

      // Check if the template exists
      const template = allTemplates.find((t) => t.id === specificTemplateId)
      if (!template) {
        return NextResponse.json(
          {
            error: "Specified template not found",
            templateId: specificTemplateId,
          },
          { status: 404 },
        )
      }

      // Check if the user already has this template
      const alreadyPurchased = purchasedTemplates.some(
        (pt) => pt.name.includes(specificTemplateId) || pt.name.includes(template.name),
      )

      if (alreadyPurchased) {
        console.log(`User already has template ${specificTemplateId}, skipping`)
        return NextResponse.json({
          success: true,
          message: "Template already purchased",
          alreadyPurchased: true,
        })
      }

      // Create the purchased template
      try {
        const purchasedTemplate = await createPurchasedTemplate(template, businessId)

        return NextResponse.json({
          success: true,
          message: "Template unlocked successfully",
          template: purchasedTemplate,
        })
      } catch (e: any) {
        console.error("Error creating purchased template:", e)
        return NextResponse.json(
          {
            error: "Failed to create purchased template",
            details: e.message,
          },
          { status: 500 },
        )
      }
    }

    // Parse invoice items
    let invoiceItems: InvoiceItem[] = []
    try {
      if (typeof invoice.items === "string") {
        invoiceItems = JSON.parse(invoice.items)
      } else if (Array.isArray(invoice.items)) {
        invoiceItems = invoice.items
      } else if (invoice.items && typeof invoice.items === "object") {
        invoiceItems = [invoice.items as InvoiceItem]
      }
      console.log("Invoice items:", JSON.stringify(invoiceItems, null, 2))
    } catch (e) {
      console.error("Error parsing invoice items:", e)
      console.log("Raw invoice items:", invoice.items)
      // Continue with empty items array
    }

    // Extract potential template names and prices from invoice
    const potentialTemplateInfo = extractTemplateInfo(invoice, invoiceItems)
    console.log("Potential template info:", JSON.stringify(potentialTemplateInfo, null, 2))

    // Find matching templates based on name and price
    const matchingTemplates = findMatchingTemplates(
      allTemplates,
      potentialTemplateInfo.names,
      potentialTemplateInfo.price || invoice.amount,
      purchasedTemplates,
    )

    console.log(`Found ${matchingTemplates.length} matching templates`)

    if (matchingTemplates.length === 0) {
      console.log("No matching templates found, trying to find any template by price")

      // If no matches by name, try to find any template with a price close to the invoice amount
      const templatesByPrice = findTemplatesByPrice(
        allTemplates,
        potentialTemplateInfo.price || invoice.amount,
        purchasedTemplates,
      )

      if (templatesByPrice.length > 0) {
        console.log(`Found ${templatesByPrice.length} templates by price`)
        const template = templatesByPrice[0]

        // Create the purchased template
        try {
          const purchasedTemplate = await createPurchasedTemplate(template, businessId)

          return NextResponse.json({
            success: true,
            message: "Template unlocked by price match",
            template: purchasedTemplate,
            matchType: "price",
          })
        } catch (e: any) {
          console.error("Error creating purchased template by price match:", e)
          return NextResponse.json(
            {
              error: "Failed to create purchased template",
              details: e.message,
            },
            { status: 500 },
          )
        }
      }

      // If we still couldn't find a template, return a more detailed error
      return NextResponse.json(
        {
          error: "No matching templates found",
          potentialNames: potentialTemplateInfo.names,
          price: potentialTemplateInfo.price || invoice.amount,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          invoiceItems: invoiceItems.length > 0 ? invoiceItems : "No items parsed",
        },
        { status: 404 },
      )
    }

    // Use the first matching template
    const template = matchingTemplates[0]
    console.log(`Selected template: ${template.id} - ${template.name}`)

    // Create the purchased template
    try {
      const purchasedTemplate = await createPurchasedTemplate(template, businessId)

      return NextResponse.json({
        success: true,
        message: "Template unlocked successfully",
        template: purchasedTemplate,
        matchType: "name_and_price",
      })
    } catch (e: any) {
      console.error("Error creating purchased template:", e)
      return NextResponse.json(
        {
          error: "Failed to create purchased template",
          details: e.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error updating template status:", error)
    return NextResponse.json(
      {
        error: "Failed to update template status",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Helper function to create a purchased template
async function createPurchasedTemplate(template: Document, businessId: string) {
  console.log(`Creating purchased template for template ${template.id}`)

  try {
    const purchasedTemplate = await db.document.create({
      data: {
        name: `template_${template.id}_${template.name}`,
        category: "template",
        businessId: businessId,
        fileUrl: template.fileUrl,
        type: "purchased_template",
      },
    })

    console.log(`Created purchased template: ${purchasedTemplate.id}`)
    return purchasedTemplate
  } catch (error: any) {
    console.error(`Error creating purchased template: ${error}`)
    throw error // Re-throw to handle in the calling function
  }
}

// Helper function to extract template info from invoice
function extractTemplateInfo(invoice: any, items: InvoiceItem[]) {
  const potentialNames: string[] = []
  let price: number | null = null

  // Check if any item has isTemplateInvoice flag
  const templateItems = items.filter((item) => item.isTemplateInvoice === true)

  if (templateItems.length > 0) {
    console.log("Found template items with isTemplateInvoice flag")

    // Extract names and prices from template items
    templateItems.forEach((item) => {
      if (item.name) potentialNames.push(item.name)
      if (item.tier) potentialNames.push(item.tier)
      if (item.price) price = item.price
    })
  }

  // If no template items found, try to extract from all items
  if (potentialNames.length === 0) {
    items.forEach((item) => {
      if (item.name) potentialNames.push(item.name)
      if (item.tier) potentialNames.push(item.tier)
      if (item.type === "template" && item.price) price = item.price
    })
  }

  // If still no names, try to extract from invoice number or customer name
  if (potentialNames.length === 0) {
    if (invoice.invoiceNumber && invoice.invoiceNumber.includes("TEMPLATE")) {
      potentialNames.push("template")
    }

    if (invoice.customerName) {
      potentialNames.push(invoice.customerName)
    }
  }

  // If no price found, use invoice amount
  if (price === null && invoice.amount) {
    price = invoice.amount
  }

  return { names: potentialNames, price }
}

// Helper function to find matching templates by name and price
function findMatchingTemplates(
  allTemplates: Document[],
  potentialNames: string[],
  targetPrice: number,
  purchasedTemplates: Document[],
) {
  // Extract template prices from names (format: Name|Price|Tier)
  const templatesWithPrices = allTemplates.map((template) => {
    const parts = template.name.split("|")
    let price = null

    // Try to extract price from the template name
    if (parts.length > 1) {
      const priceStr = parts[1]
      const parsedPrice = Number.parseFloat(priceStr)
      if (!isNaN(parsedPrice)) {
        price = parsedPrice
      }
    }

    return {
      ...template,
      extractedPrice: price,
      priceDifference: price !== null ? Math.abs(price - targetPrice) : Number.MAX_VALUE,
    }
  })

  console.log(
    "Templates with extracted prices:",
    templatesWithPrices.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.extractedPrice,
      difference: t.priceDifference,
    })),
  )

  // Find templates that match by name
  const matchingTemplates = templatesWithPrices.filter((template) => {
    // Check if any potential name is included in the template name
    const nameMatch = potentialNames.some((name) => name && template.name.toLowerCase().includes(name.toLowerCase()))

    // Check if the user already has this template
    const alreadyPurchased = purchasedTemplates.some(
      (pt) => pt.name.includes(template.id) || pt.name.includes(template.name),
    )

    return nameMatch && !alreadyPurchased
  })

  // Sort matching templates by price difference (closest price first)
  matchingTemplates.sort((a, b) => a.priceDifference - b.priceDifference)

  console.log(
    "Matching templates sorted by price:",
    matchingTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.extractedPrice,
      difference: t.priceDifference,
    })),
  )

  return matchingTemplates
}

// Helper function to find templates by price
function findTemplatesByPrice(allTemplates: Document[], targetPrice: number, purchasedTemplates: Document[]) {
  // Extract template prices from names (format: Name|Price|Tier)
  const templatesWithPrices = allTemplates.map((template) => {
    const parts = template.name.split("|")
    let price = null

    // Try to extract price from the template name
    if (parts.length > 1) {
      const priceStr = parts[1]
      const parsedPrice = Number.parseFloat(priceStr)
      if (!isNaN(parsedPrice)) {
        price = parsedPrice
      }
    }

    return {
      ...template,
      extractedPrice: price,
      priceDifference: price !== null ? Math.abs(price - targetPrice) : Number.MAX_VALUE,
    }
  })

  // Filter out templates the user already has
  const availableTemplates = templatesWithPrices.filter((template) => {
    const alreadyPurchased = purchasedTemplates.some(
      (pt) => pt.name.includes(template.id) || pt.name.includes(template.name),
    )

    return !alreadyPurchased
  })

  // Sort by price difference (closest price first)
  availableTemplates.sort((a, b) => a.priceDifference - b.priceDifference)

  console.log(
    "Templates sorted by price proximity:",
    availableTemplates.slice(0, 3).map((t) => ({
      id: t.id,
      name: t.name,
      price: t.extractedPrice,
      difference: t.priceDifference,
    })),
  )

  return availableTemplates
}

