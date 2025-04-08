import { NextResponse } from "next/server"
import { getSummaryMetrics } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"
    const propertyId = url.searchParams.get("propertyId") || process.env.GOOGLE_ANALYTICS_VIEW_ID

    const summaryMetrics = await getSummaryMetrics(startDate, endDate)

    return NextResponse.json(summaryMetrics)
  } catch (error: any) {
    console.error("Error fetching summary metrics:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}
