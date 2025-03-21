import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if the user is an admin (you should implement proper auth checks here)

    // Get the raw data from the database
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM PricingSettings WHERE \`key\` = 'pricing_data' LIMIT 1
    `)

    if (result && Array.isArray(result) && result.length > 0) {
      // Parse the JSON value for better viewing
      try {
        const parsedValue = JSON.parse(result[0].value)
        result[0].parsedValue = parsedValue
      } catch (e) {
        console.error("Error parsing JSON value:", e)
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        planCount: result[0].parsedValue?.plans?.length || 0,
        stateCount: Object.keys(result[0].parsedValue?.stateFilingFees || {}).length || 0,
      })
    }

    return NextResponse.json({
      success: false,
      message: "No pricing data found in database",
    })
  } catch (error) {
    console.error("Error in debug pricing DB route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve pricing data from database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

