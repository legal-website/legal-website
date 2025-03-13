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

    // Get all master templates
    const masterTemplates = await db.document.findMany({
      where: {
        category: "template_master",
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

    // Add a "purchased" flag to each master template
    const templatesWithPurchaseStatus = masterTemplates.map((template) => ({
      ...template,
      purchased: purchasedTemplateMap.has(template.id),
    }))

    return NextResponse.json({ templates: templatesWithPurchaseStatus })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

