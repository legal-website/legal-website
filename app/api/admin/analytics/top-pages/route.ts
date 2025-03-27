import { NextResponse } from "next/server"
import { getTopPages } from "@/lib/google-analytics"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
// Import the isAdmin function
import { isAdmin } from "@/lib/role"

export async function GET(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    // Use the isAdmin function for authorization checks
    // Replace any existing authorization check with:
    if (!session || !isAdmin(session.user.role)) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string, 10) : 10

    const viewId = process.env.GOOGLE_ANALYTICS_VIEW_ID

    if (!viewId) {
      return new NextResponse(JSON.stringify({ error: "Google Analytics View ID not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await getTopPages(viewId, startDate, endDate, limit)

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching top pages:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch analytics data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

