import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Document, Invoice } from "@prisma/client"

// GET - Fetch templates available to users
export async function GET(req: NextRequest) {
  console.log("GET /api/user/templates - Request received")
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session:", session ? "Found" : "Not found")

    if (!session) {
      console.log("Unauthorized: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log("User ID:", userId)

    // Get the user with their business
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })
    console.log("User found:", user ? "Yes" : "No")
    console.log("Business found:", user?.business ? "Yes" : "No")

    if (!user) {
      console.log("User not found for ID:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const businessId = user.business?.id
    console.log("Business ID:", businessId || "None")

    // Get all master templates (documents with category "template_master")
    const masterTemplates = await db.document.findMany({
      where: {
        category: "template_master",
        type: "template",
      },
      orderBy: { createdAt: "desc" },
    })

    // Get user's purchased templates (if business exists)
    let userTemplates: Document[] = []
    let pendingTemplates: { templateId: string; invoiceId: string }[] = []

    if (businessId) {
      // Get templates the user has already purchased
      userTemplates = await db.document.findMany({
        where: {
          businessId: businessId,
          category: "template",
          type: "template",
        },
      })
    }

    // Get pending template purchases from invoices
    const pendingInvoices: Invoice[] = await db.invoice.findMany({
      where: {
        userId: userId,
        status: "pending",
      },
    })

    // Extract template IDs from pending invoices
    pendingTemplates = pendingInvoices.flatMap((invoice) => {
      try {
        const items = JSON.parse(invoice.items)
        return items
          .filter((item: any) => item.type === "template")
          .map((item: any) => ({
            templateId: item.templateId,
            invoiceId: invoice.id,
          }))
      } catch (e) {
        console.error("Error parsing invoice items:", e)
        return []
      }
    })

    // Create a map of template IDs that the user has purchased
    const purchasedTemplateMap = new Map()
    userTemplates.forEach((template) => {
      // Assuming the original template ID is stored in the name field with a prefix
      const originalTemplateId = template.name.startsWith("template_")
        ? template.name.substring(9) // Remove "template_" prefix
        : null

      if (originalTemplateId) {
        purchasedTemplateMap.set(originalTemplateId, true)
      }
    })

    // Create a map of pending template purchases
    const pendingTemplateMap = new Map()
    pendingTemplates.forEach((item) => {
      pendingTemplateMap.set(item.templateId, item.invoiceId)
    })

    // Add purchase status to each master template
    const templatesWithStatus = masterTemplates.map((template) => {
      // Parse metadata from name if available
      let price = 0
      let pricingTier = "Free"
      let displayName = template.name

      try {
        // Try to extract metadata from name (format: "name|price|tier|count|status")
        const parts = template.name.split("|")

        if (parts && parts.length > 1) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          pricingTier = parts[2] || "Free"
        }
      } catch (e) {
        console.error("Error parsing template metadata:", e)
      }

      const isPurchased = purchasedTemplateMap.has(template.id)
      const isPending = pendingTemplateMap.has(template.id)
      const invoiceId = isPending ? pendingTemplateMap.get(template.id) : undefined

      return {
        id: template.id,
        name: displayName,
        category: template.category,
        updatedAt: template.updatedAt.toISOString(),
        price: price,
        pricingTier: pricingTier,
        purchased: isPurchased,
        isPending: isPending,
        invoiceId: invoiceId,
        fileUrl: isPurchased ? template.fileUrl : undefined,
        description: `${pricingTier} template for ${template.category}`,
      }
    })

    // If no templates were found, return some mock templates for testing
    if (templatesWithStatus.length === 0) {
      console.log("No templates found, returning mock data")
      return NextResponse.json({
        templates: [
          {
            id: "mock-1",
            name: "LLC Formation",
            description: "Complete LLC formation document package",
            category: "Business Formation",
            updatedAt: new Date().toISOString(),
            price: 49.99,
            pricingTier: "Standard",
            purchased: false,
            isPending: false,
            fileUrl: undefined,
          },
          {
            id: "mock-2",
            name: "Employment Agreement",
            description: "Standard employment agreement template",
            category: "Contracts",
            updatedAt: new Date().toISOString(),
            price: 29.99,
            pricingTier: "Basic",
            purchased: false,
            isPending: false,
            fileUrl: undefined,
          },
          {
            id: "mock-3",
            name: "Privacy Policy",
            description: "Website privacy policy template",
            category: "Compliance",
            updatedAt: new Date().toISOString(),
            price: 0,
            pricingTier: "Free",
            purchased: true,
            isPending: false,
            fileUrl: "https://example.com/templates/privacy-policy.pdf",
          },
        ],
      })
    }

    return NextResponse.json({ templates: templatesWithStatus })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

