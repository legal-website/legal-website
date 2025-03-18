import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    console.log("GET /api/annual-reports/deadlines - Starting request")

    const session = await getServerSession(authOptions)
    console.log("Session:", session ? "Authenticated" : "Not authenticated")

    if (!session?.user) {
      console.log("Unauthorized - No session or user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching deadlines for user:", session.user.id)

    try {
      // Test database connection
      await db.$queryRaw`SELECT 1 as connection_test`
      console.log("Database connection successful")

      // Get deadlines for the current user
      const deadlines = await db.annualReportDeadline.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          dueDate: "asc",
        },
      })

      console.log(`Found ${deadlines.length} deadlines`)
      return NextResponse.json({ deadlines })
    } catch (dbError: any) {
      console.error("Database error:", dbError)
      console.error("Error message:", dbError.message)
      console.error("Error code:", dbError.code)

      if (dbError.meta) {
        console.error("Error meta:", dbError.meta)
      }

      // Check for specific error types
      if (dbError.message && dbError.message.includes("relation") && dbError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            deadlines: [],
            error: "Database table not found",
            details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
          },
          { status: 500 },
        )
      }

      if (dbError.message && dbError.message.includes("column") && dbError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            deadlines: [],
            error: "Database column not found",
            details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
          },
          { status: 500 },
        )
      }

      // Generic database error
      return NextResponse.json(
        {
          deadlines: [],
          error: "Database error",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json(
      {
        deadlines: [],
        error: "Failed to fetch deadlines",
        details: process.env.NODE_ENV === "development" ? (error as any).toString() : undefined,
      },
      { status: 500 },
    )
  }
}

