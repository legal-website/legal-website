import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get the user with their business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "User or business not found" }, { status: 404 })
    }

    // Fetch all templates
    const allTemplates = await prisma.document.findMany({
      where: {
        type: "template",
      },
    })

    // Fetch user's templates (templates they have access to)
    const userTemplates = await prisma.document.findMany({
      where: {
        businessId: user.business.id,
        type: "user_template",
      },
    })

    // Fetch access records to determine which templates the user has access to
    const accessRecords = await prisma.document.findMany({
      where: {
        businessId: user.business.id,
        type: "access_template",
        name: {
          contains: `_${userId}`,
        },
      },
    })

    // Extract templateIds from access records
    const accessibleTemplateIds = accessRecords
      .map((record) => {
        const parts = record.name.split("_")
        return parts.length > 1 ? parts[1] : null
      })
      .filter(Boolean)

    // Transform templates to include purchased status
    const transformedTemplates = allTemplates.map((template) => {
      // Extract template metadata
      let displayName = template.name
      let price = 0
      let pricingTier = "Free"

      try {
        const parts = template.name.split("|")
        if (parts && parts.length > 2) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          pricingTier = parts[2] || "Free"
        }
      } catch (e) {
        console.error("Error parsing template metadata:", e)
      }

      // Check if user has access to this template
      const hasAccess =
        accessibleTemplateIds.includes(template.id) || userTemplates.some((ut) => ut.fileUrl === template.fileUrl)

      return {
        id: template.id,
        name: displayName,
        description: `${displayName} template`,
        category: template.category,
        price: price,
        pricingTier: pricingTier,
        fileUrl: template.fileUrl,
        updatedAt: template.updatedAt,
        purchased: hasAccess,
        isPending: false,
      }
    })

    // Get pending template invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        userId: userId,
        status: "pending",
        // You might need to adjust this if you store template info differently
        items: {
          contains: "template",
        },
      },
    })

    // Mark templates with pending invoices
    // This is a simplification - you'll need to adjust based on how you track template invoices
    const finalTemplates = transformedTemplates.map((template) => {
      const pendingInvoice = pendingInvoices.find(
        (invoice) => invoice.items.includes(template.id) || invoice.items.includes(template.name),
      )

      return {
        ...template,
        isPending: !!pendingInvoice,
        invoiceId: pendingInvoice?.id,
      }
    })

    return NextResponse.json({ templates: finalTemplates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

