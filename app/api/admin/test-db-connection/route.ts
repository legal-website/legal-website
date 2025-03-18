import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  console.log("GET /api/admin/test-db-connection - Start")

  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("GET /api/admin/test-db-connection - Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      console.log("GET /api/admin/test-db-connection - Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Test database connection by simply checking if the db object exists
    console.log("Testing database connection...")
    try {
      // Check if db object exists and is an object
      if (db && typeof db === "object") {
        console.log("Database client is available")

        // Log available methods/properties for debugging
        console.log("Available properties:", Object.keys(db))

        return NextResponse.json({
          success: true,
          message: "Database client is available",
          clientType: typeof db,
          availableProperties: Object.keys(db),
        })
      } else {
        console.error("Database client is not available or not an object")
        return NextResponse.json(
          {
            error: "Database client is not available or not properly initialized",
          },
          { status: 500 },
        )
      }
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: `Database connection error: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`,
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

