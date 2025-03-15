import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Define the global type for our in-memory storage
declare global {
  // eslint-disable-next-line no-var
  var userDownloads: Record<string, number>
}

// Initialize the global variable if it doesn't exist
if (typeof global.userDownloads === "undefined") {
  global.userDownloads = {}
}

// Type for the download count map
type DownloadCountMap = Record<string, number>

// GET endpoint to retrieve user's download counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Create a download count map from our in-memory storage
    const downloadCountMap: DownloadCountMap = {}

    // Extract downloads for this user from global storage
    Object.entries(global.userDownloads).forEach(([key, count]) => {
      if (key.startsWith(`${userId}:`)) {
        const templateId = key.split(":")[1]
        downloadCountMap[templateId] = count
      }
    })

    return NextResponse.json({ success: true, downloadCounts: downloadCountMap })
  } catch (error) {
    console.error("Error fetching user download counts:", error)
    return NextResponse.json(
      { error: "Failed to fetch download counts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

// POST endpoint to increment a user's download count for a template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { templateId } = body as { templateId: string }

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Use our in-memory storage
    const key = `${userId}:${templateId}`
    global.userDownloads[key] = (global.userDownloads[key] || 0) + 1
    const currentCount = global.userDownloads[key]

    return NextResponse.json({
      success: true,
      downloadCount: currentCount,
      fallback: true,
    })
  } catch (error) {
    console.error("Error incrementing download count:", error)

    // Try a simpler approach if the main one fails
    try {
      const session = await getServerSession(authOptions)
      const userId = session?.user?.id
      const body = await request.json()
      const templateId = (body as { templateId?: string }).templateId

      if (!userId || !templateId) {
        throw new Error("Missing user ID or template ID")
      }

      const key = `${userId}:${templateId}`
      global.userDownloads[key] = (global.userDownloads[key] || 0) + 1
      const currentCount = global.userDownloads[key]

      return NextResponse.json({
        success: true,
        downloadCount: currentCount,
        fallback: true,
      })
    } catch (fallbackError) {
      console.error("Fallback storage also failed:", fallbackError)
      return NextResponse.json(
        {
          error: "Failed to increment download count",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  }
}

