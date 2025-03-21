import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { PricingPlan } from "@/context/pricing-context"

export async function GET() {
  try {
    console.log("Debugging pricing data...")

    // Check if the table exists
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
      console.log("PricingSettings table exists")
    } catch (error) {
      console.log("PricingSettings table does not exist")
      tableExists = false

      return NextResponse.json({
        tableExists: false,
        error: "PricingSettings table does not exist",
        details: error instanceof Error ? error.message : String(error),
      })
    }

    if (!tableExists) {
      return NextResponse.json({ tableExists: false })
    }

    // Get all pricing data
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM PricingSettings
    `)

    // If we have pricing data, parse it
    const parsedData: Array<{
      id: number
      key: string
      createdAt: Date
      updatedAt: Date
      planCount?: number
      stateCount?: number
      plans?: string
      valuePreview: string
      error?: string
    }> = []

    if (result && Array.isArray(result)) {
      for (const row of result) {
        try {
          if (row.key === "pricing_data") {
            const parsed = JSON.parse(row.value)
            parsedData.push({
              id: row.id,
              key: row.key,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              planCount: parsed.plans?.length || 0,
              stateCount: Object.keys(parsed.stateFilingFees || {}).length,
              plans: parsed.plans?.map((plan: PricingPlan) => `${plan.name}: $${plan.price}`).join(", "),
              // Don't return the full value as it could be very large
              valuePreview: `${row.value.substring(0, 100)}...`,
            })
          } else {
            parsedData.push({
              id: row.id,
              key: row.key,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              valuePreview: `${row.value.substring(0, 100)}...`,
            })
          }
        } catch (e) {
          parsedData.push({
            id: row.id,
            key: row.key,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            error: "Failed to parse JSON",
            valuePreview: `${row.value.substring(0, 100)}...`,
          })
        }
      }
    }

    return NextResponse.json({
      tableExists: true,
      rowCount: result.length,
      data: parsedData,
    })
  } catch (error) {
    console.error("Error during debug:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

