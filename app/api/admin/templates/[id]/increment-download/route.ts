import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id

    // Get the current template
    const template = await prisma.document.findUnique({
      where: { id: templateId, type: "template" },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Parse metadata from name if available
    let name = template.name
    let price = 0
    let pricingTier = "Free"
    let usageCount = 0
    let status = "active"

    try {
      // Try to extract metadata from name (format: "name|price|tier|count|status")
      const parts = template.name.split("|")
      if (parts.length > 1) {
        name = parts[0]
        price = Number.parseFloat(parts[1]) || 0
        pricingTier = parts[2] || "Free"
        usageCount = Number.parseInt(parts[3]) || 0
        status = parts[4] || "active"
      }
    } catch (e) {
      console.error("Error parsing template metadata:", e)
    }

    // Increment usage count
    usageCount++

    // Update template with new metadata
    const updatedName = `${name}|${price}|${pricingTier}|${usageCount}|${status}`

    await prisma.document.update({
      where: { id: templateId },
      data: { name: updatedName },
    })

    return NextResponse.json({ success: true, usageCount })
  } catch (error: any) {
    console.error("Error incrementing download count:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

