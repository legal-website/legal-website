import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { Subscription } from "@/types/subscription"

export async function GET() {
  try {
    // Get total subscriptions
    const totalSubscriptions = await prisma.subscription.count()

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "active" },
    })

    // Get canceled subscriptions
    const canceledSubscriptions = await prisma.subscription.count({
      where: { status: "canceled" },
    })

    // Calculate monthly recurring revenue (MRR)
    const monthlySubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        billingCycle: "monthly",
      },
    })
    const monthlyRecurringRevenue = monthlySubscriptions.reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

    // Calculate annual recurring revenue (ARR)
    const annualSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        billingCycle: "annual",
      },
    })
    const annualRecurringRevenue = annualSubscriptions.reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

    // Calculate total revenue (including one-time payments)
    const allSubscriptions = await prisma.subscription.findMany()
    const totalRevenue = allSubscriptions.reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

    return NextResponse.json({
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      totalRevenue,
    })
  } catch (error) {
    console.error("Error fetching subscription stats:", error)
    return NextResponse.json({ error: "Failed to fetch subscription statistics" }, { status: 500 })
  }
}

