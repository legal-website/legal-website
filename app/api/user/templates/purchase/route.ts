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
    const { templateId, price } = await req.json()

    if (!templateId) {
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
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Generate invoice number
    const invoiceNumber = `TEMP-${Date.now().toString().slice(-6)}`

    // Create invoice items
    const items = [
      {
        type: "template",
        templateId: template.id,
        name: template.name,
        price: price || 29.99,
        quantity: 1,
      },
    ]

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: user.name || "Customer",
        customerEmail: user.email,
        amount: price || 29.99,
        status: "pending",
        items: JSON.stringify(items),
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true, invoice })
  } catch (error: any) {
    console.error("Error purchasing template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

