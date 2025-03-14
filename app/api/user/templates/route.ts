import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { InvoiceItem } from "@/lib/prisma-types"

// GET - Fetch templates available to users
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get the user with their business
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "User or business not found" }, { status: 404 })
    }

    const businessId = user.business.id

    // Get all master templates (documents with type "template")
    const masterTemplates = await db.document.findMany({
      where: {
        type: "template",
      },
      orderBy: { createdAt: "desc" },
    })

    // Get user's purchased templates (documents in their business with type "purchased_template")
    const userTemplates = await db.document.findMany({
      where: {
        businessId: businessId,
        type: "purchased_template",
      },
    })

    // Get user's pending template invoices
    const pendingInvoices = await db.invoice.findMany({
      where: {
        userId,
        status: "pending",
      },
    })

    // Create a map of template IDs that the user has purchased
    const purchasedTemplateMap = new Map()
    userTemplates.forEach((template) => {
      // Extract the original template ID from the name (format: template_<id>_<name>)
      const match = template.name.match(/^template_([^_]+)/)
      if (match && match[1]) {
        purchasedTemplateMap.set(match[1], true)
      }
    })

    // Create a map of pending template IDs
    const pendingTemplateMap = new Map()
    pendingInvoices.forEach((invoice) => {
      try {
        let items: InvoiceItem[] = []
        try {
          const parsedItems = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items

          items = Array.isArray(parsedItems) ? parsedItems : [parsedItems]
        } catch (e) {
          console.error(`Error parsing items for invoice ${invoice.id}:`, e)
          return
        }

        // Find template items
        const templateItems = items.filter(
          (item) =>
            item.type === "template" ||
            (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
        )

        // For each template item, find matching master template
        templateItems.forEach((item) => {
          const matchingTemplate = masterTemplates.find((template) =>
            template.name.toLowerCase().includes(item.tier?.toLowerCase() || ""),
          )

          if (matchingTemplate) {
            pendingTemplateMap.set(matchingTemplate.id, invoice.id)
          }
        })
      } catch (e) {
        console.error(`Error processing invoice ${invoice.id}:`, e)
      }
    })

    // Process templates to extract metadata and add purchase status
    const processedTemplates = masterTemplates.map((doc) => {
      // Parse metadata from name if available
      let price = 0
      let pricingTier = "Free"
      let usageCount = 0
      let status = "active"
      let displayName = doc.name
      let description = ""

      try {
        // Try to extract metadata from name (format: "name|price|tier|count|status")
        const parts = doc.name.split("|")

        if (parts && parts.length > 1) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          pricingTier = parts[2] || "Free"
          usageCount = Number.parseInt(parts[3]) || 0
          status = parts[4] || "active"
          description = parts[5] || `${displayName} template`
        }
      } catch (e) {
        // If parsing fails, use defaults
        console.error("Error parsing template metadata:", e)
      }

      return {
        id: doc.id,
        name: displayName,
        description: description || `${displayName} template`,
        category: doc.category || "Uncategorized",
        updatedAt: doc.updatedAt.toISOString(),
        status: status,
        usageCount: usageCount,
        price: price,
        pricingTier: pricingTier,
        fileUrl: doc.fileUrl,
        purchased: purchasedTemplateMap.has(doc.id),
        isPending: pendingTemplateMap.has(doc.id),
        invoiceId: pendingTemplateMap.get(doc.id),
      }
    })

    return NextResponse.json({ templates: processedTemplates })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

