import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  console.log("Simple admin filings API: Starting request")

  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`
      console.log("Database connection successful")
    } catch (connError) {
      console.error("Database connection error:", connError)
      return NextResponse.json(
        {
          error: "Database connection error",
          details: (connError as Error).message,
        },
        { status: 500 },
      )
    }

    // Step 1: Try to get just the filings without includes
    try {
      // Add explicit type annotation for basicFilings
      const basicFilings = await prisma.annualReportFiling.findMany({
        take: 10, // Limit to 10 records
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`Found ${basicFilings.length} basic filings`)

      // Step 2: Try to get users
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      console.log(`Found ${users.length} users`)

      // Step 3: Try to get deadlines
      const deadlines = await prisma.annualReportDeadline.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          dueDate: true,
        },
      })

      console.log(`Found ${deadlines.length} deadlines`)

      // Return the simplified data
      return NextResponse.json({
        success: true,
        filingCount: basicFilings.length,
        userCount: users.length,
        deadlineCount: deadlines.length,
        sampleFilings: basicFilings.slice(0, 3),
      })
    } catch (queryError) {
      console.error("Error querying data:", queryError)
      return NextResponse.json(
        {
          error: "Error querying data",
          details: (queryError as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error:", error)
    return NextResponse.json(
      {
        error: "Error fetching filings",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

