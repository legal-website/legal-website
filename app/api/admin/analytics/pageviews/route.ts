import { NextResponse } from "next/server"
import { getPageViewsOverTime } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    const pageViews = await getPageViewsOverTime(startDate, endDate)

    return NextResponse.json(pageViews)
  } catch (error: any) {
    console.error("Error fetching page views:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

