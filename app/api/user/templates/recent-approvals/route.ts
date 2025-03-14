import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Find recently approved template invoices for this user
    // Look for invoices that were approved in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const recentApprovals = await prisma.invoice.findMany({
      where: {
        userId: userId,
        status: "paid",
        updatedAt: {
          gte: fiveMinutesAgo,
        },
        // Look for template invoices using a simpler approach
        OR: [
          {
            items: {
              contains: "template",
            },
          },
          {
            items: {
              contains: "isTemplateInvoice",
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        items: true,
        updatedAt: true,
      },
    })

    // Process the invoices to extract template names
    const processedApprovals = recentApprovals.map((invoice) => {
      let templateName = "Unknown Template"

      try {
        if (typeof invoice.items === "string") {
          const parsedItems = JSON.parse(invoice.items)
          templateName = parsedItems.templateName || "Unknown Template"
        }
      } catch (e) {
        console.error("Error parsing invoice items:", e)
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        templateName,
        approvedAt: invoice.updatedAt,
      }
    })

    return NextResponse.json({ recentApprovals: processedApprovals })
  } catch (error) {
    console.error("Error fetching recent approvals:", error)
    return NextResponse.json({ error: "Failed to fetch recent approvals" }, { status: 500 })
  }
}

