import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as connection_test`
      console.log("Database connection test:", connectionTest)
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        {
          error: "Database connection error",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    // Get a user ID to use for the test
    let userId = null
    try {
      const user = await prisma.user.findFirst({
        select: {
          id: true,
        },
      })

      if (user) {
        userId = user.id
        console.log("Found user ID:", userId)
      } else {
        console.log("No user found")
      }
    } catch (error) {
      console.error("Error finding user:", error)
      return NextResponse.json(
        {
          error: "Error finding user",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    // Get all tables - MariaDB syntax
    try {
      const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
      `
      console.log("Tables:", tables)

      return NextResponse.json({
        connectionTest: "Success",
        userId,
        tables,
        message: "Database test completed",
      })
    } catch (error) {
      console.error("Error getting tables:", error)
      return NextResponse.json(
        {
          error: "Error getting tables",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in database test:", error)
    return NextResponse.json(
      {
        error: "Failed to run database test",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

