import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session?.user) {
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
        type: "template",
      },
    })

    // Get user's purchased templates
    const userTemplates = await db.document.findMany({
      where: {
        businessId: businessId,
        OR: [{ type: "purchased_template" }, { name: { startsWith: "template_" } }],
      },
    })

    // Get user's pending invoices
    const pendingInvoices = await db.invoice.findMany({
      where: {
        userId,
        status: "pending",
      },
      select: {
        id: true,
        invoiceNumber: true,
        items: true,
        amount: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      userId,
      businessId,
      masterTemplates: masterTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
      })),
      userTemplates: userTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
      })),
      pendingInvoices,
    })
  } catch (error: any) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

