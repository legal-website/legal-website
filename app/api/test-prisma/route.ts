import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if we can access the amendment model
    const modelNames = Object.keys(db).filter(
      (key) => !key.startsWith("_") && typeof db[key as keyof typeof db] === "object",
    )

    // Try to count amendments
    let amendmentCount = 0
    let error = null

    try {
      amendmentCount = await db.amendment.count()
    } catch (err) {
      error = (err as Error).message
    }

    return NextResponse.json({
      success: true,
      availableModels: modelNames,
      hasAmendmentModel: modelNames.includes("amendment"),
      amendmentCount,
      error,
    })
  } catch (error) {
    console.error("Error testing Prisma:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

