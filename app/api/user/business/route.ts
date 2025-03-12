import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id as string },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse custom data from industry field
    let customData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
    }

    if (user.business?.industry) {
      try {
        const parsedData = JSON.parse(user.business.industry as string)
        customData = { ...customData, ...parsedData }
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    return NextResponse.json({
      business: user.business
        ? {
            ...user.business,
            serviceStatus: customData.serviceStatus,
            llcStatusMessage: customData.llcStatusMessage,
            llcProgress: customData.llcProgress,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

