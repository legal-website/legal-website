import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  console.log("GET /api/admin/test-db - Start")

  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("GET /api/admin/test-db - Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      console.log("GET /api/admin/test-db - Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Test database connection
    console.log("Testing database connection...")
    try {
      // Try to access the database - we'll just check if we can access the client
      // without using specific methods that might not be available
      console.log("Database client:", typeof db)

      // Check what properties and methods are available on the db object
      const dbProperties = Object.keys(db)
      console.log("Available db properties:", dbProperties)

      // Try to determine if amendment model exists
      const hasAmendmentModel = "amendment" in db
      console.log("Has amendment model:", hasAmendmentModel)

      // Try to determine if user model exists
      const hasUserModel = "user" in db
      console.log("Has user model:", hasUserModel)

      return NextResponse.json({
        success: true,
        message: "Database client accessed successfully",
        dbInfo: {
          type: typeof db,
          properties: dbProperties,
          hasAmendmentModel,
          hasUserModel,
        },
      })
    } catch (dbError) {
      console.error("Database access error:", dbError)

      return NextResponse.json(
        {
          error: `Database access error: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`,
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing database:", error)
    return NextResponse.json(
      {
        error: "Failed to test database: " + (error instanceof Error ? error.message : "Unknown error"),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

