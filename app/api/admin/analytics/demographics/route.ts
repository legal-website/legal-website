import { NextResponse } from "next/server"
import { getCountries } from "@/lib/analytics/ga4"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate") || "7daysAgo"
    const endDate = url.searchParams.get("endDate") || "today"

    const countries = await getCountries(startDate, endDate)

    return NextResponse.json(countries)
  } catch (error: any) {
    console.error("Error fetching demographics:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}

