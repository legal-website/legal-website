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

    const { status, notes } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Update the payout
    const payout = await db.affiliatePayout.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes: notes || undefined,
      },
    })

    // If the payout is being rejected, add the amount back to the user's pending earnings
    if (status === "REJECTED") {
      // Get the user's affiliate link
      const userLink = await db.affiliateLink.findFirst({
        where: {
          userId: payout.userId,
        },
      })

      if (userLink) {
        // Get all pending conversions for this user
        const pendingConversions = await db.affiliateConversion.findMany({
          where: {
            linkId: userLink.id,
            status: "PENDING",
          },
        })

        // Calculate total pending amount
        const pendingAmount = pendingConversions.reduce((total, conversion) => {
          return total + Number(conversion.commission)
        }, 0)

        // Add the rejected payout amount back to the user's pending earnings
        // This is done by updating the status of some approved conversions back to pending
        // until we reach the rejected amount

        // First, get approved conversions that aren't paid yet
        const approvedConversions = await db.affiliateConversion.findMany({
          where: {
            linkId: userLink.id,
            status: "APPROVED",
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        let remainingAmount = Number(payout.amount)

        // Update conversions until we've covered the rejected amount
        for (const conversion of approvedConversions) {
          if (remainingAmount <= 0) break

          const conversionAmount = Number(conversion.commission)

          await db.affiliateConversion.update({
            where: {
              id: conversion.id,
            },
            data: {
              status: "PENDING",
            },
          })

          remainingAmount -= conversionAmount
        }

        // If we still have remaining amount, create a new pending conversion
        if (remainingAmount > 0) {
          await db.affiliateConversion.create({
            data: {
              linkId: userLink.id,
              orderId: `REFUND-${payout.id}`,
              amount: remainingAmount,
              commission: remainingAmount,
              status: "PENDING",
            },
          })
        }
      }
    }

    // Fetch user data separately
    const user = await db.user.findUnique({
      where: { id: payout.userId },
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

