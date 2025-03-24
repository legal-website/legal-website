import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { AffiliateConversionStatus } from "@/types/affiliate-types"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { method, fullName, email, bankName, accountNumber, mobileNumber, serviceProvider, additionalInfo, amount } =
      data

    // Validate required fields
    if (!method || !fullName || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse amount to number
    const payoutAmount = Number(amount)

    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 })
    }

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Get pending conversions
    const pendingConversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc", // Process oldest conversions first
      },
    })

    // Calculate total pending amount
    const pendingAmount = pendingConversions.reduce((sum, conversion) => sum + Number(conversion.commission), 0)

    if (payoutAmount > pendingAmount) {
      return NextResponse.json(
        { error: `Requested amount exceeds available balance of $${pendingAmount}` },
        { status: 400 },
      )
    }

    // Get affiliate settings
    const settings = await db.affiliateSettings.findFirst()
    const minPayoutAmount = settings ? Number(settings.minPayoutAmount) : 50

    if (payoutAmount < minPayoutAmount) {
      return NextResponse.json({ error: `Minimum payout amount is $${minPayoutAmount}` }, { status: 400 })
    }

    // Create payout record
    const payout = await db.affiliatePayout.create({
      data: {
        userId: session.user.id,
        amount: payoutAmount,
        method,
        status: "PENDING",
        notes: JSON.stringify({
          method,
          fullName,
          bankName: bankName || "",
          accountNumber: accountNumber || "",
          iban: data.iban || "",
          swiftCode: data.swiftCode || "",
          branchAddress: data.branchAddress || "",
          email: email || "",
          mobileNumber: mobileNumber || "",
          serviceProvider: serviceProvider || "",
          cnic: data.cnic || "",
          additionalInfo: additionalInfo || "",
        }),
      },
    })

    // Process conversions for partial payout
    let remainingAmount = payoutAmount
    const conversionsToUpdate = []

    for (const conversion of pendingConversions) {
      const conversionAmount = Number(conversion.commission)

      if (remainingAmount >= conversionAmount) {
        // Take the full conversion
        conversionsToUpdate.push({
          id: conversion.id,
          status: "APPROVED",
          metadata: JSON.stringify({
            payoutId: payout.id,
            originalStatus: conversion.status,
            fullAmount: true,
          }),
        })
        remainingAmount -= conversionAmount
      } else if (remainingAmount > 0) {
        // Need to split this conversion
        // Create a new conversion record for the remaining amount
        await db.affiliateConversion.create({
          data: {
            linkId: conversion.linkId,
            orderId: `${conversion.orderId}-SPLIT`,
            amount: conversion.amount,
            commission: (conversionAmount - remainingAmount).toString(),
            status: "PENDING",
          },
        })

        // Update the original conversion with the partial amount
        conversionsToUpdate.push({
          id: conversion.id,
          status: "APPROVED",
          commission: remainingAmount.toString(),
          metadata: JSON.stringify({
            payoutId: payout.id,
            originalStatus: conversion.status,
            fullAmount: false,
            originalAmount: conversionAmount,
          }),
        })

        remainingAmount = 0
      }

      if (remainingAmount <= 0) break
    }

    // Update all the conversions individually since $transaction isn't available
    for (const conv of conversionsToUpdate) {
      await db.affiliateConversion.update({
        where: { id: conv.id },
        data: {
          status: conv.status as AffiliateConversionStatus,
          ...(conv.commission ? { commission: conv.commission } : {}),
          metadata: conv.metadata,
        },
      })
    }

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}

