import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = (await db.affiliateSettings.findFirst()) || {
      id: 1,
      commissionRate: 10,
      minPayoutAmount: 50,
      cookieDuration: 30,
      updatedAt: new Date(),
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching affiliate settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commissionRate, minPayoutAmount, cookieDuration } = await req.json()

    const settings = await db.affiliateSettings.upsert({
      where: { id: 1 },
      update: {
        commissionRate,
        minPayoutAmount,
        cookieDuration,
      },
      create: {
        id: 1,
        commissionRate,
        minPayoutAmount,
        cookieDuration,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error updating affiliate settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

