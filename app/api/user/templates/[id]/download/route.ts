import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const userId = (session.user as any).id

    // Check if the template exists (using Document model with type="template")
    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Since there's no TemplateAccess model, we need to implement a different way to check access
    // This is a placeholder - you'll need to implement your own access control logic
    // For example, you might have a separate table or use metadata in the document name

    // For free templates (price = 0) or templates the user has access to
    // Parse price from template name if it exists (format: "name|price|tier|count|status")
    let price = 0
    try {
      const parts = template.name.split("|")
      if (parts && parts.length > 1) {
        price = Number.parseFloat(parts[1]) || 0
      }
    } catch (e) {
      console.error("Error parsing template price:", e)
    }

    // Check if user has access to this template
    // This is a simplified check - you'll need to implement your own access control
    const hasAccess = price === 0 || (await checkUserAccess(userId, templateId))

    if (hasAccess) {
      // Increment usage count if tracking in the name
      try {
        const parts = template.name.split("|")
        if (parts && parts.length > 3) {
          const displayName = parts[0]
          const price = parts[1]
          const tier = parts[2]
          const usageCount = (Number.parseInt(parts[3]) || 0) + 1
          const status = parts[4] || "active"

          // Update the document with incremented usage count
          await prisma.document.update({
            where: { id: templateId },
            data: {
              name: `${displayName}|${price}|${tier}|${usageCount}|${status}`,
            },
          })
        }
      } catch (e) {
        console.error("Error updating template usage count:", e)
      }

      // Extract display name from metadata
      let displayName = template.name
      try {
        const parts = template.name.split("|")
        if (parts && parts.length > 0) {
          displayName = parts[0]
        }
      } catch (e) {
        console.error("Error parsing template name:", e)
      }

      return NextResponse.json({
        fileUrl: template.fileUrl,
        name: displayName,
      })
    }

    // If the user doesn't have access
    return NextResponse.json({ error: "You don't have access to this template" }, { status: 403 })
  } catch (error) {
    console.error("Error downloading template:", error)
    return NextResponse.json({ error: "Failed to download template" }, { status: 500 })
  }
}

// Helper function to check if a user has access to a template
// This is a placeholder - implement your own access control logic
async function checkUserAccess(userId: string, templateId: string): Promise<boolean> {
  // Example implementation - you might have a different way to track access
  // For example, you might have a separate table or use metadata

  // For now, we'll return true for testing purposes
  // In a real implementation, you would check your access control system
  return true
}

