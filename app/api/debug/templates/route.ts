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

    // Get all templates
    const allTemplates = await db.document.findMany({
      where: {
        type: "template",
      },
    })

    // Get user's business ID
    const user = await db.user.findUnique({
      where: { id: session.user.id as string },
      include: { business: true },
    })

    const businessId = user?.business?.id

    // Get user's purchased templates
    const purchasedTemplates = businessId
      ? await db.document.findMany({
          where: {
            businessId: businessId,
            type: "purchased_template",
          },
        })
      : []

    // Get pending template invoices
    const pendingInvoices = await db.invoice.findMany({
      where: {
        userId: session.user.id as string,
        status: "pending",
      },
    })

    // Filter to find template invoices
    const pendingTemplateInvoices = pendingInvoices.filter((invoice) => {
      // Check if invoice items contain template
      if (typeof invoice.items === "string") {
        return invoice.items.toLowerCase().includes("template")
      }
      return false
    })

    return NextResponse.json({
      allTemplates,
      purchasedTemplates,
      pendingTemplateInvoices,
      user: {
        id: session.user.id,
        businessId,
      },
    })
  } catch (error: any) {
    console.error("Error in debug templates:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching template debug info",
      },
      { status: 500 },
    )
  }
}

