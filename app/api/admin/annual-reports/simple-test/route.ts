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
        where: {
          role: "CLIENT",
        },
        select: {
          id: true,
        },
      })

      if (user) {
        userId = user.id
        console.log("Found user ID:", userId)
      } else {
        console.log("No client user found")
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

    // Check if AnnualReportDeadline table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AnnualReportDeadline'
        ) as table_exists
      `
      console.log("AnnualReportDeadline table check:", tableCheck)
    } catch (error) {
      console.error("Error checking table:", error)
      return NextResponse.json(
        {
          error: "Error checking table",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    // Get available models
    const models = Object.keys(prisma).filter(
      (key) => !key.startsWith("_") && typeof prisma[key as keyof typeof prisma] === "object",
    )

    return NextResponse.json({
      connectionTest: "Success",
      userId,
      models,
      message: "Simple test completed",
    })
  } catch (error) {
    console.error("Error in simple test:", error)
    return NextResponse.json(
      {
        error: "Failed to run simple test",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

