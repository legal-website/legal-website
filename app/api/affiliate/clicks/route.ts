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
        clicks: [],
      })
    }

    // Get all clicks for this affiliate link
    const clicks = await db.affiliateClick.findMany({
      where: {
        linkId: affiliateLink.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      clicks,
    })
  } catch (error: any) {
    console.error("Error fetching affiliate clicks:", error)
    return NextResponse.json({ error: "Failed to fetch clicks", message: error.message }, { status: 500 })
  }
}

