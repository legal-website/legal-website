import { NextResponse } from "next/server"
import { getDeviceCategories } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    const devices = await getDeviceCategories(startDate, endDate)

    return NextResponse.json(devices)
  } catch (error: any) {
    console.error("Error fetching devices:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

