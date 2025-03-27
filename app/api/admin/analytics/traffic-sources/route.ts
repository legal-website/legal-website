import { NextResponse } from "next/server"
import { getTrafficSources } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    const trafficSources = await getTrafficSources(startDate, endDate)

    return NextResponse.json(trafficSources)
  } catch (error: any) {
    console.error("Error fetching traffic sources:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

