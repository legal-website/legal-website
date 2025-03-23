import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all affiliate links
    const affiliateLinks = await db.affiliateLink.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Get all affiliate conversions
    const affiliateConversions = await db.affiliateConversion.findMany({
      include: {
        link: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Get all invoices with referral information
    const invoicesWithReferral = await db.invoice.findMany({
      where: {
        OR: [
          { customerCompany: { contains: "ref:" } },
          { customerAddress: { contains: "ref:" } },
          { customerCity: { contains: "ref:" } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerEmail: true,
        amount: true,
        status: true,
        createdAt: true,
        customerCompany: true,
        customerAddress: true,
        customerCity: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        affiliateLinks,
        affiliateConversions,
        invoicesWithReferral,
      },
    })
  } catch (error: any) {
    console.error("Error in affiliate debug:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

