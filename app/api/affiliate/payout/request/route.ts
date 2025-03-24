import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { Decimal } from "@prisma/client/runtime/library"

// Define types for better type safety
interface AffiliateConversion {
  id: string
  linkId: string
  orderId: string
  amount: number | string | Decimal
  commission: number | string | Decimal
  status: string
  createdAt: Date
  metadata?: string
}

interface AffiliateSettings {
  minPayoutAmount: number | Decimal
}

// Update the POST function to handle custom payout amounts
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const {
      method,
      fullName,
      email,
      bankName,
      accountNumber,
      mobileNumber,
      serviceProvider,
      additionalInfo,
      amount,
      branchAddress,
    } = data

    // Validate required fields
    if (!method || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Get pending conversions
    const pendingConversions = (await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: "PENDING",
      },
    })) as AffiliateConversion[]

    // Calculate total pending amount
    const pendingAmount = pendingConversions.reduce((sum, conversion) => sum + Number(conversion.commission), 0)

    // Get affiliate settings
    const settings = (await db.affiliateSettings.findFirst()) as AffiliateSettings | null
    const minPayoutAmount = settings?.minPayoutAmount || 50

    // Determine payout amount (use custom amount if provided, otherwise use all pending)
    const payoutAmount = amount ? Number(amount) : pendingAmount

    // Validate payout amount
    if (payoutAmount <= 0) {
      return NextResponse.json({ error: "Payout amount must be greater than 0" }, { status: 400 })
    }

    if (payoutAmount > pendingAmount) {
      return NextResponse.json({ error: "Requested amount exceeds available balance" }, { status: 400 })
    }

    // For custom amounts less than minimum, check if it's the full balance
    if (payoutAmount < Number(minPayoutAmount) && payoutAmount < pendingAmount) {
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
          branchAddress: branchAddress || "",
          email: email || "",
          mobileNumber: mobileNumber || "",
          serviceProvider: serviceProvider || "",
          cnic: data.cnic || "",
          additionalInfo: additionalInfo || "",
        }),
      },
    })

    // If requesting full amount, update all conversions
    if (payoutAmount === pendingAmount) {
      // Update each conversion individually if transaction is not available
      for (const conversion of pendingConversions) {
        await db.affiliateConversion.update({
          where: { id: conversion.id },
          data: {
            status: "APPROVED", // Change to APPROVED to remove from pending balance
            metadata: JSON.stringify({
              payoutId: payout.id,
              originalStatus: conversion.status,
            }),
          },
        })
      }
    } else {
      // For partial payouts, we need to handle it differently
      // Sort conversions by date (oldest first)
      const sortedConversions = [...pendingConversions].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

      let remainingAmount = payoutAmount
      const conversionsToUpdate: { id: string; amount: number; fullConversion: boolean }[] = []

      // Collect conversions until we reach the requested amount
      for (const conversion of sortedConversions) {
        const conversionAmount = Number(conversion.commission)

        if (remainingAmount >= conversionAmount) {
          // Take the full conversion
          conversionsToUpdate.push({
            id: conversion.id,
            amount: conversionAmount,
            fullConversion: true,
          })
          remainingAmount -= conversionAmount
        } else if (remainingAmount > 0) {
          // Need to split this conversion
          // First, create a new conversion with the remaining amount
          const splitConversion = await db.affiliateConversion.create({
            data: {
              linkId: conversion.linkId,
              orderId: conversion.orderId,
              amount: conversion.amount,
              commission: remainingAmount,
              status: "APPROVED",
              metadata: JSON.stringify({
                payoutId: payout.id,
                originalStatus: conversion.status,
                splitFrom: conversion.id,
              }),
            },
          })

          // Then update the original conversion to reduce its amount
          await db.affiliateConversion.update({
            where: { id: conversion.id },
            data: {
              commission: Number(conversion.commission) - remainingAmount,
            },
          })

          remainingAmount = 0
        }

        if (remainingAmount <= 0) break
      }

      // Update the status of full conversions
      for (const conv of conversionsToUpdate) {
        if (conv.fullConversion) {
          await db.affiliateConversion.update({
            where: { id: conv.id },
            data: {
              status: "APPROVED",
              metadata: JSON.stringify({
                payoutId: payout.id,
                originalStatus: "PENDING",
              }),
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}

