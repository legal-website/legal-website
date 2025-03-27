import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(request: Request) {
  try {
    // Log environment variables (without exposing sensitive data)
    const envCheck = {
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasViewId: !!process.env.GOOGLE_ANALYTICS_VIEW_ID,
      viewIdValue: process.env.GOOGLE_ANALYTICS_VIEW_ID,
    }

    // Try to initialize the auth client
    let authClient
    try {
      authClient = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/analytics.readonly"],
      )

      // Test the auth client
      await authClient.authorize()
    } catch (authError: any) {
      return NextResponse.json(
        {
          success: false,
          stage: "Authentication",
          error: authError.message,
          envCheck,
        },
        { status: 500 },
      )
    }

    // Initialize the Analytics Reporting API
    const analyticsReporting = google.analyticsreporting({
      version: "v4",
      auth: authClient,
    })

    // Try to make a simple request
    try {
      const viewId = process.env.GOOGLE_ANALYTICS_VIEW_ID

      if (!viewId) {
        return NextResponse.json(
          {
            success: false,
            stage: "Configuration",
            error: "Google Analytics View ID not configured",
            envCheck,
          },
          { status: 500 },
        )
      }

      const response = await analyticsReporting.reports.batchGet({
        requestBody: {
          reportRequests: [
            {
              viewId,
              dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
              metrics: [{ expression: "ga:sessions" }],
              dimensions: [{ name: "ga:date" }],
            },
          ],
        },
      })

      // Check if we got a valid response with proper null checks
      if (!response.data.reports || response.data.reports.length === 0) {
        return NextResponse.json(
          {
            success: false,
            stage: "API Response",
            error: "No reports returned from Google Analytics",
            envCheck,
          },
          { status: 500 },
        )
      }

      const report = response.data.reports[0]

      // Explicitly check if report.data exists before accessing its properties
      if (!report.data) {
        return NextResponse.json({
          success: true,
          message: "Connected to Google Analytics but no data was returned",
          hasData: false,
          envCheck,
        })
      }

      // Create a safe slice function to handle potentially undefined arrays
      const safeSlice = (arr: any[] | undefined | null, start: number, end?: number) => {
        if (!arr || !Array.isArray(arr)) {
          return []
        }
        return arr.slice(start, end)
      }

      // Now check if rows exists and has data
      const rows = report.data.rows
      const hasRows = rows !== undefined && rows !== null && rows.length > 0

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Google Analytics",
        hasData: hasRows,
        // Use the safe slice function instead of directly accessing rows
        sampleData: hasRows ? safeSlice(rows, 0, 3) : null,
        envCheck,
      })
    } catch (apiError: any) {
      return NextResponse.json(
        {
          success: false,
          stage: "API Request",
          error: apiError.message,
          envCheck,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        stage: "Unknown",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

