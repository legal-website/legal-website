import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the affiliate link for the current user
    const affiliateLink = await db.affiliateLink.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
    })

    if (!affiliateLink) {
      return NextResponse.json({
        success: true,
        conversions: [],
      })
    }

    // Get all conversions for this affiliate link
    const conversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      conversions: conversions.map((conversion) => ({
        ...conversion,
        amount: Number.parseFloat(conversion.amount.toString()),
        commission: Number.parseFloat(conversion.commission.toString()),
      })),
    })
  } catch (error: any) {
    console.error("Error fetching affiliate conversions:", error)
    return NextResponse.json({ error: "Failed to fetch conversions", message: error.message }, { status: 500 })
  }
}

