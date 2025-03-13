import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

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

    // Get user's purchased templates (documents in their business with category "template")
    const userTemplates = await db.document.findMany({
      where: {
        businessId: businessId,
        category: "template",
        type: "template",
      },
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
        description: description,
        category: doc.category,
        updatedAt: doc.updatedAt.toISOString(),
        status: status,
        usageCount: usageCount,
        price: price,
        pricingTier: pricingTier,
        fileUrl: doc.fileUrl,
        purchased: purchasedTemplateMap.has(doc.id),
      }
    })

    return NextResponse.json({ templates: processedTemplates })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

