import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET endpoint to retrieve user's download counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's download counts from the database
    const userDownloads = await db.userTemplateDownload.findMany({
      where: {
        userId: userId,
      },
      select: {
        templateId: true,
        downloadCount: true,
      },
    })

    // Convert to a map for easier consumption by the client
    const downloadCountMap = userDownloads.reduce(
      (acc, item) => {
        acc[item.templateId] = item.downloadCount
        return acc
      },
      {} as Record<string, number>,
    )

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
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Check if a record already exists
    const existingRecord = await db.userTemplateDownload.findUnique({
      where: {
        userId_templateId: {
          userId: userId,
          templateId: templateId,
        },
      },
    })

    if (existingRecord) {
      // Update existing record
      const updatedRecord = await db.userTemplateDownload.update({
        where: {
          userId_templateId: {
            userId: userId,
            templateId: templateId,
          },
        },
        data: {
          downloadCount: existingRecord.downloadCount + 1,
          lastDownloaded: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        downloadCount: updatedRecord.downloadCount,
      })
    } else {
      // Create new record
      const newRecord = await db.userTemplateDownload.create({
        data: {
          userId: userId,
          templateId: templateId,
          downloadCount: 1,
          lastDownloaded: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        downloadCount: newRecord.downloadCount,
      })
    }
  } catch (error) {
    console.error("Error incrementing download count:", error)

    // If the table doesn't exist yet, create a simple in-memory storage as fallback
    try {
      // Try to store in a simple key-value store
      const session = await getServerSession(authOptions)
      const userId = session?.user?.id
      const body = await request.json()
      const { templateId } = body

      if (!userId || !templateId) {
        throw new Error("Missing user ID or template ID")
      }

      // Use localStorage-like approach with global variable
      if (typeof global.userDownloads === "undefined") {
        global.userDownloads = {}
      }

      const key = `${userId}:${templateId}`
      global.userDownloads[key] = (global.userDownloads[key] || 0) + 1

      return NextResponse.json({
        success: true,
        downloadCount: global.userDownloads[key],
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

