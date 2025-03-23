import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get all affiliate links with user information
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

    // Get all affiliate conversions with link information
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
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get invoices that might have referral information
    const invoicesWithReferral = await db.invoice.findMany({
      where: {
        OR: [
          { customerCompany: { contains: "ref:" } },
          { customerAddress: { contains: "ref:" } },
          { customerCity: { contains: "ref:" } },
        ],
      },
      orderBy: {
        createdAt: "desc",
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
  } catch (error) {
    console.error("Error fetching affiliate debug data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch affiliate debug data" }, { status: 500 })
  }
}

