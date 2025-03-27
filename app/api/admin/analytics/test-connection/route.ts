import { NextResponse } from "next/server"
import { testGA4Connection } from "@/lib/analytics/ga4"

export async function GET() {
  try {
    // Check if environment variables are set
    const hasClientEmail = !!process.env.GOOGLE_CLIENT_EMAIL
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY
    const hasViewId = !!process.env.GOOGLE_ANALYTICS_VIEW_ID

    if (!hasClientEmail || !hasPrivateKey || !hasViewId) {
      return NextResponse.json({
        success: false,
        error: "Missing required environment variables",
        environmentCheck: {
          hasClientEmail,
          hasPrivateKey,
          hasViewId,
        },
      })
    }

    // Test the connection
    const result = await testGA4Connection()

    return NextResponse.json({
      ...result,
      environmentCheck: {
        hasClientEmail,
        hasPrivateKey,
        hasViewId,
        viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
      },
    })
  } catch (error: any) {
    console.error("Error testing Google Analytics connection:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

