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

    // Get all affiliate cookies stored in system settings
    // Using findFirst with where condition instead of findMany
    const affiliateCookies = await Promise.all(
      (await db.$queryRaw`SELECT * FROM SystemSettings WHERE \`key\` LIKE 'affiliate_cookie_%'`) as any[],
    )

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

    return NextResponse.json({
      success: true,
      data: {
        affiliateCookies,
        affiliateLinks,
        affiliateConversions,
      },
    })
  } catch (error: any) {
    console.error("Error in affiliate debug:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

