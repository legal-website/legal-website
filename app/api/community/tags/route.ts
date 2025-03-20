import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Get all tags with post count
export async function GET() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    // Format tags for response
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count?.posts || 0,
    }))

    return NextResponse.json({
      success: true,
      tags: formattedTags,
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tags" }, { status: 500 })
  }
}

