import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"
import { AffiliateConversionStatus, AffiliatePayoutStatus } from "@/lib/affiliate-types"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, notes } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get the current payout to check if we're rejecting it
    const currentPayout = await db.affiliatePayout.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    } as any) // Use type assertion to avoid TypeScript errors

    if (!currentPayout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    // If we're rejecting a payout, we need to handle it specially
    if (status === AffiliatePayoutStatus.REJECTED) {
      // Find the affiliate link for this user
      const affiliateLink = await db.affiliateLink.findUnique({
        where: { userId: currentPayout.userId },
      })

      if (!affiliateLink) {
        return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
      }

      // Find all conversions associated with this payout that are in PAID status
      // We'll set them back to APPROVED so they're available for payout again
      await db.$executeRaw`
        UPDATE affiliate_conversions 
        SET status = ${AffiliateConversionStatus.APPROVED}, updatedAt = NOW() 
        WHERE linkId = ${affiliateLink.id} AND status = ${AffiliateConversionStatus.PAID}
      `

      // Update the payout with rejected status and mark as not processed
      // This will allow the user to see it in their dashboard
      const payout = await db.affiliatePayout.update({
        where: { id: params.id },
        data: {
          status,
          adminNotes: notes || undefined,
          processed: false, // Mark as not processed so it shows up in the dashboard
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      } as any) // Use type assertion to avoid TypeScript errors

      return NextResponse.json({
        payout,
      })
    }

    // For other status updates, just update the status and notes
    const payout = await db.affiliatePayout.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes: notes || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    } as any) // Use type assertion to avoid TypeScript errors

    return NextResponse.json({
      payout,
    })
  } catch (error) {
    console.error("Error updating affiliate payout:", error)
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 })
  }
}

