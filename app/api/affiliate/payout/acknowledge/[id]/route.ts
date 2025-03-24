import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the payout
    const payout = await db.affiliatePayout.findUnique({
      where: {
        id: params.id,
        userId: session.user.id, // Ensure the payout belongs to the user
        processed: false, // Only unprocessed payouts can be acknowledged
      },
    })

    if (!payout) {
      return NextResponse.json({ error: "Payout not found or already processed" }, { status: 404 })
    }

    // Mark the payout as processed
    await db.affiliatePayout.update({
      where: { id: params.id },
      data: { processed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error acknowledging rejected payout:", error)
    return NextResponse.json({ error: "Failed to acknowledge payout" }, { status: 500 })
  }
}

