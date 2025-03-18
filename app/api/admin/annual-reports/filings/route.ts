import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  console.log("Admin filings API: Starting request")

  try {
    // Step 1: Check authentication
    console.log("Admin filings API: Checking authentication")
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      console.log("Admin filings API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Admin filings API: Authentication successful")

    // Step 2: Try a simple query first to verify database connection
    try {
      console.log("Admin filings API: Testing database connection")
      const count = await prisma.annualReportFiling.count()
      console.log(`Admin filings API: Database connection successful, found ${count} filings`)
    } catch (dbConnectionError) {
      console.error("Admin filings API: Database connection error:", dbConnectionError)
      return NextResponse.json(
        {
          error: "Database connection error",
          details: (dbConnectionError as Error).message,
        },
        { status: 500 },
      )
    }

    // Step 3: Fetch filings with minimal includes to reduce complexity
    try {
      console.log("Admin filings API: Fetching filings with minimal data")

      // Simplified query without complex includes
      const filings = await prisma.annualReportFiling.findMany({
        select: {
          id: true,
          userId: true,
          deadlineId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          receiptUrl: true,
          reportUrl: true,
          filedDate: true,
          userNotes: true,
          adminNotes: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to 100 records to avoid memory issues
      })

      console.log(`Admin filings API: Successfully fetched ${filings.length} filings`)

      return NextResponse.json({
        filings,
        success: true,
        timestamp: new Date().toISOString(),
      })
    } catch (queryError) {
      console.error("Admin filings API: Error fetching filings:", queryError)
      return NextResponse.json(
        {
          error: "Error fetching filings",
          details: (queryError as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Admin filings API: Unhandled error:", error)
    return NextResponse.json(
      {
        error: "Unhandled server error",
        details: (error as Error).message,
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}

