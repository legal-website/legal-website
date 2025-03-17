import { type NextRequest, NextResponse } from "next/server"
import { getAllSubscriptions, createSubscription } from "@/lib/subscription-service"
import type { Subscription } from "@/types/subscription"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || undefined

    const { subscriptions, total } = await getAllSubscriptions(page, limit)

    // Filter by status if provided
    const filteredSubscriptions = status
      ? subscriptions.filter((sub: Subscription) => sub.status === status)
      : subscriptions

    return NextResponse.json({
      subscriptions: filteredSubscriptions,
      total: status ? filteredSubscriptions.length : total,
    })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.planId || !data.businessId || !data.price) {
      return NextResponse.json({ error: "Plan ID, business ID, and price are required" }, { status: 400 })
    }

    const subscription = await createSubscription({
      ...data,
      startDate: new Date(data.startDate || Date.now()),
      nextBillingDate: new Date(data.nextBillingDate || Date.now()),
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}

