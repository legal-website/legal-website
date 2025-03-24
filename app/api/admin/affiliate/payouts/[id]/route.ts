import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, adminNotes } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get the current payout to check if it's being rejected
    const currentPayout = await db.affiliatePayout.findUnique({
      where: { id: params.id },
    })

    if (!currentPayout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    // Prevent changing status of already rejected payouts
    if (currentPayout.status === "REJECTED" && status !== "REJECTED") {
      return NextResponse.json(
        {
          error: "Cannot change status of rejected payouts",
        },
        { status: 400 },
      )
    }

    // Update the payout - use 'notes' field instead of 'adminNotes'
    const payout = await db.affiliatePayout.update({
      where: { id: params.id },
      data: {
        status,
        notes: adminNotes || undefined,
      },
    })

    // If the payout is being rejected, add the amount back to the user's pending earnings
    if (status === "REJECTED" && currentPayout.status !== "REJECTED") {
      // Find the user's affiliate link
      const affiliateLink = await db.affiliateLink.findFirst({
        where: { userId: currentPayout.userId },
      })

      if (affiliateLink) {
        // Create a new conversion record to credit the user
        await db.affiliateConversion.create({
          data: {
            linkId: affiliateLink.id,
            orderId: `REFUND-${payout.id}`,
            amount: currentPayout.amount,
            commission: currentPayout.amount,
            status: "PENDING",
            notes: `Refunded from rejected payout #${payout.id}`,
          },
        })
      }
    }

    // Fetch user data separately
    const user = await db.user.findUnique({
      where: { id: currentPayout.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({
      payout: {
        ...payout,
        user,
      },
    })
  } catch (error) {
    console.error("Error updating affiliate payout:", error)
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 })
  }
}

