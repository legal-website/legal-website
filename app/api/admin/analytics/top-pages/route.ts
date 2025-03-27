import { NextResponse } from "next/server"
import { getTopPages } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    const topPages = await getTopPages(startDate, endDate)

    return NextResponse.json(topPages)
  } catch (error: any) {
    console.error("Error fetching top pages:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

