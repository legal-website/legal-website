import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create affiliate link for the user
    const existingLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            clicks: true,
            conversions: true,
          },
        },
      },
    })

    if (existingLink) {
      return NextResponse.json({ link: existingLink })
    }

    // Create new affiliate link
    const code = nanoid(8)
    const newLink = await db.affiliateLink.create({
      data: {
        userId: session.user.id,
        code,
      },
      include: {
        _count: {
          select: {
            clicks: true,
            conversions: true,
          },
        },
      },
    })

    return NextResponse.json({ link: newLink })
  } catch (error) {
    console.error("Error fetching affiliate link:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate link" }, { status: 500 })
  }
}

