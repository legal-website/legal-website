import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get template statistics from Document model where type="template"
    const templates = await prisma.document.findMany({
      where: {
        type: "template",
      },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        fileUrl: true,
        businessId: true,
      },
    })

    // Transform data to include parsed metadata
    const templateStats = templates.map((template) => {
      // Parse metadata from name if available
      let displayName = template.name
      let price = 0
      let pricingTier = "Free"
      let usageCount = 0
      let status = "active"

      try {
        // Try to extract metadata from name (format: "name|price|tier|count|status")
        const parts = template.name.split("|")

        if (parts && parts.length > 1) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          pricingTier = parts[2] || "Free"
          usageCount = Number.parseInt(parts[3]) || 0
          status = parts[4] || "active"
        }
      } catch (e) {
        // If parsing fails, use defaults
        console.error("Error parsing template metadata:", e)
      }

      return {
        id: template.id,
        name: displayName,
        category: template.category,
        price: price,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        usageCount: usageCount,
        status: status,
        pricingTier: pricingTier,
        fileUrl: template.fileUrl,
      }
    })

    return NextResponse.json({ templateStats })
  } catch (error) {
    console.error("Error fetching template stats:", error)
    return NextResponse.json({ error: "Failed to fetch template statistics" }, { status: 500 })
  }
}

