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

    // Prepare update data
    const updateData: any = { status }

    // Only update notes if adminNotes is provided
    if (adminNotes !== undefined && adminNotes.trim() !== "") {
      // Store admin notes directly, not as part of payment details
      updateData.notes = adminNotes
    } else if (currentPayout.notes) {
      // If we have existing notes and no new admin notes provided, keep the existing notes
      // This ensures we don't lose payment details when updating status
      updateData.notes = currentPayout.notes
    }

    // Update the payout
    const payout = await db.affiliatePayout.update({
      where: { id: params.id },
      data: updateData,
    })

    // If the payout is being rejected, add the amount back to the user's pending earnings
    if (status === "REJECTED" && currentPayout.status !== "REJECTED") {
      // Find the user's affiliate link
      const affiliateLink = await db.affiliateLink.findFirst({
        where: { userId: currentPayout.userId },
      })

      if (affiliateLink) {
        // Find all conversions that were part of this payout request
        const payoutConversions = await db.affiliateConversion.findMany({
          where: {
            linkId: affiliateLink.id,
            orderId: {
              contains: `-PAYOUT-${payout.id}`,
            },
          },
        })

        // If we found conversions associated with this payout
        if (payoutConversions.length > 0) {
          // Update each conversion back to PENDING status
          for (const conversion of payoutConversions) {
            // Extract the original order ID by removing the payout reference
            const originalOrderId = conversion.orderId.split("-PAYOUT-")[0]

            await db.affiliateConversion.update({
              where: { id: conversion.id },
              data: {
                status: "PENDING",
                orderId: originalOrderId,
              },
            })
          }
        } else {
          // Fallback: If we can't find the specific conversions, create a new conversion record
          await db.affiliateConversion.create({
            data: {
              linkId: affiliateLink.id,
              orderId: `REFUND-${payout.id}`,
              amount: currentPayout.amount,
              commission: currentPayout.amount,
              status: "PENDING",
            },
          })
        }
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

