import { type NextRequest, NextResponse } from "next/server"
import { getAllSubscriptions, createSubscription } from "@/lib/subscription-service"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const result = await getAllSubscriptions(page, limit)

    return NextResponse.json(result)
  } catch (error) {
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
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}

