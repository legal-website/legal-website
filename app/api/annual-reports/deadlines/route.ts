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

    console.log("Client deadlines API: Fetching deadlines for user", session.user.id)

    // Get deadlines for the current user
    const deadlines = await db.annualReportDeadline.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    console.log(`Client deadlines API: Found ${deadlines.length} deadlines`)

    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json({ error: "Failed to fetch deadlines", details: (error as Error).message }, { status: 500 })
  }
}

