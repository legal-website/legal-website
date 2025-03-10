import { NextResponse } from "next/server"

// This is a placeholder route that returns a 404 since Stripe is no longer used
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is no longer in use as we've switched to direct bank transfers" },
    { status: 404 },
  )
}

