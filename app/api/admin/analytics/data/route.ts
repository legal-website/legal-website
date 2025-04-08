import { NextResponse } from "next/server"
import {
  getPageViewsOverTime,
  getSummaryMetrics,
  getTopPages,
  getTrafficSources,
  getDeviceCategories,
  getCountries,
} from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    // Fetch all data in parallel
    const [summaryMetrics, pageViewsOverTime, topPages, trafficSources, deviceCategories, countries] =
      await Promise.all([
        getSummaryMetrics(startDate, endDate),
        getPageViewsOverTime(startDate, endDate),
        getTopPages(startDate, endDate),
        getTrafficSources(startDate, endDate),
        getDeviceCategories(startDate, endDate),
        getCountries(startDate, endDate),
      ])

    return NextResponse.json({
      success: true,
      data: {
        summaryMetrics,
        pageViewsOverTime,
        topPages,
        trafficSources,
        deviceCategories,
        countries,
      },
    })
  } catch (error: any) {
    console.error("Error fetching analytics data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
