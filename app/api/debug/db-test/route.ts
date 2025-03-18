import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    const connectionTest = await db.$queryRaw`SELECT 1 as connection_test`

    // Get all tables
    const tables = await db.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Try a simple query on a known table (users)
    const usersCount = await db.user.count()

    return NextResponse.json({
      connectionTest,
      tables,
      usersCount,
      message: "Database connection test successful",
    })
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        error: "Failed to test database connection",
        details: process.env.NODE_ENV === "development" ? (error as any).toString() : undefined,
      },
      { status: 500 },
    )
  }
}

