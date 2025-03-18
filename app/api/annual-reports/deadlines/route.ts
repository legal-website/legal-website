import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get deadlines for the current user
    const deadlines = await db.annualReportDeadline.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json({ error: "Failed to fetch deadlines" }, { status: 500 })
  }
}

