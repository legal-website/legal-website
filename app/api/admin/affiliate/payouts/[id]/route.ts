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

    console.log(`Updating payout ${params.id} with status: ${status}`)

    // First check if the payout exists
    try {
      const payoutExists = await db.affiliatePayout.findUnique({
        where: { id: params.id },
        select: { id: true },
      } as any) // Use type assertion to avoid TypeScript errors

      if (!payoutExists) {
        return NextResponse.json({ error: "Payout not found" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error checking if payout exists:", error)
      return NextResponse.json(
        {
          error: "Failed to check if payout exists",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // Get the current payout to check if we're rejecting it
    let currentPayout
    try {
      currentPayout = await db.affiliatePayout.findUnique({
        where: { id: params.id },
      })

      if (!currentPayout) {
        return NextResponse.json({ error: "Payout not found" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error fetching current payout:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch current payout",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // If we're rejecting a payout, we need to handle it specially
    if (status === AffiliatePayoutStatus.REJECTED) {
      try {
        // Find the affiliate link for this user
        const affiliateLink = await db.affiliateLink.findUnique({
          where: { userId: currentPayout.userId },
        })

        if (!affiliateLink) {
          return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
        }

        console.log(`Found affiliate link for user ${currentPayout.userId}: ${affiliateLink.id}`)

        // Find all conversions associated with this payout that are in PAID status
        // We'll set them back to APPROVED so they're available for payout again
        try {
          await db.$executeRaw`
            UPDATE affiliate_conversions 
            SET status = ${AffiliateConversionStatus.APPROVED}, updatedAt = NOW() 
            WHERE linkId = ${affiliateLink.id} AND status = ${AffiliateConversionStatus.PAID}
          `
          console.log(`Reset conversions for link ${affiliateLink.id} from PAID to APPROVED`)
        } catch (error) {
          console.error("Error updating conversions:", error)
          return NextResponse.json(
            {
              error: "Failed to update conversions",
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }

        // Update the payout with rejected status and mark as not processed
        try {
          const updateData = {
            status,
            adminNotes: notes || null,
            processed: false, // Mark as not processed so it shows up in the dashboard
          }

          console.log(`Updating payout with data:`, updateData)

          const payout = await db.affiliatePayout.update({
            where: { id: params.id },
            data: updateData,
          })

          console.log(`Successfully updated payout: ${payout.id}`)

          return NextResponse.json({ payout })
        } catch (error) {
          console.error("Error updating payout:", error)
          return NextResponse.json(
            {
              error: "Failed to update payout",
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      } catch (error) {
        console.error("Error in rejection flow:", error)
        return NextResponse.json(
          {
            error: "Failed in rejection flow",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    }

    // For other status updates, just update the status and notes
    try {
      const updateData = {
        status,
        adminNotes: notes || null,
      }

      console.log(`Updating payout with data:`, updateData)

      const payout = await db.affiliatePayout.update({
        where: { id: params.id },
        data: updateData,
      })

      console.log(`Successfully updated payout: ${payout.id}`)

      return NextResponse.json({ payout })
    } catch (error) {
      console.error("Error updating payout:", error)
      return NextResponse.json(
        {
          error: "Failed to update payout",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in payout update:", error)
    return NextResponse.json(
      {
        error: "Unhandled error in payout update",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

