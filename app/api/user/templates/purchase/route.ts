import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const data = await req.json()

    // Validate required fields
    if (!data.templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the template
    const template = await db.document.findUnique({
      where: {
        id: data.templateId,
        category: "template_master",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Parse template metadata to get price and name
    let templateName = template.name
    let templatePrice = data.price || 0

    try {
      // Try to extract metadata from name (format: "name|price|tier|count|status")
      const parts = template.name.split("|")
      if (parts && parts.length > 1) {
        templateName = parts[0]
        templatePrice = Number.parseFloat(parts[1]) || data.price || 0
      }
    } catch (e) {
      console.error("Error parsing template metadata:", e)
    }

    // Generate a unique invoice number
    const invoiceNumber = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create an invoice for the template purchase
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: user.name || "Customer",
        customerEmail: user.email,
        amount: templatePrice,
        status: "pending",
        items: JSON.stringify([
          {
            type: "template",
            templateId: template.id,
            name: templateName,
            description: `${templateName} template`,
            price: templatePrice,
            tier: "Template",
          },
        ]),
        userId: userId,
      },
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error("Error purchasing template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

