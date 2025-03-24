import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payoutData = await req.json()

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Get pending earnings
    const pendingConversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: "PENDING",
      },
    })

    const pendingEarnings = pendingConversions.reduce((sum, c) => sum + Number(c.commission), 0)

    // Get affiliate settings
    const settings = (await db.affiliateSettings.findFirst()) || {
      minPayoutAmount: 50,
    }

    // Convert minPayoutAmount to number for comparison
    const minPayoutAmount = Number(settings.minPayoutAmount)

    if (pendingEarnings < minPayoutAmount) {
      return NextResponse.json({ error: `You need at least $${minPayoutAmount} to request a payout` }, { status: 400 })
    }

    // Create payout request
    const payout = await db.affiliatePayout.create({
      data: {
        userId: session.user.id,
        amount: pendingEarnings.toString(),
        method: payoutData.method,
        status: "PENDING",
        notes: JSON.stringify(payoutData),
      },
    })

    // Update conversions to mark them as being processed for payout
    // We'll use a special status "PROCESSING_PAYOUT" to track these
    for (const conversion of pendingConversions) {
      await db.affiliateConversion.update({
        where: { id: conversion.id },
        data: {
          status: "APPROVED",
          // Add a reference to the payout request
          orderId: `${conversion.orderId}-PAYOUT-${payout.id}`,
        },
      })
    }

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}

