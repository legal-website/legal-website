import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { Subscription } from "@/types/subscription"

export async function GET() {
  try {
    // Get all subscriptions
    const subscriptions = await prisma.subscription.findMany()

    // Calculate statistics
    const totalSubscriptions = subscriptions.length
    const activeSubscriptions = subscriptions.filter((sub: Subscription) => sub.status === "active").length
    const canceledSubscriptions = subscriptions.filter((sub: Subscription) => sub.status === "canceled").length

    // Calculate revenue
    const monthlyRecurringRevenue = subscriptions
      .filter((sub: Subscription) => sub.status === "active" && sub.billingCycle === "monthly")
      .reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

    const annualRecurringRevenue = subscriptions
      .filter((sub: Subscription) => sub.status === "active" && sub.billingCycle === "annual")
      .reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

    const totalRevenue = subscriptions.reduce((sum: number, sub: Subscription) => sum + sub.price, 0)

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

