import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Try to count amendments
    const count = await (db as any).amendment.count()

    return NextResponse.json({
      success: true,
      message: "Successfully connected to amendments table",
      count,
    })
  } catch (error) {
    console.error("Error testing amendments:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

