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

    // Get the user with their business
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "User or business not found" }, { status: 404 })
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

    // Generate a unique invoice number
    const invoiceNumber = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create an invoice for the template purchase
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: user.name || "Customer",
        customerEmail: user.email,
        amount: data.price || 0, // Use provided price or default to 0
        status: "pending",
        items: JSON.stringify([
          {
            type: "template",
            templateId: template.id,
            name: template.name,
            price: data.price || 0,
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

