import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    console.log("Admin filings API: Request received")
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters for pagination
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    console.log(`Admin filings API: Fetching page ${page}, limit ${limit}`)

    try {
      // Get count of total filings
      const totalCount = await prisma.annualReportFiling.count()
      console.log(`Admin filings API: Total filings count: ${totalCount}`)

      // Get paginated filings with user and deadline info
      const filings = await prisma.annualReportFiling.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deadline: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(
        `Admin API: Successfully fetched ${filings.length} filings (page ${page} of ${Math.ceil(totalCount / limit)})`,
      )

      return NextResponse.json({
        filings,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      })
    } catch (dbError: any) {
      console.error("Database error in admin filings route:", dbError)
      console.error("Error code:", dbError.code)
      console.error("Error message:", dbError.message)

      if (dbError.meta) {
        console.error("Error meta:", dbError.meta)
      }

      return NextResponse.json(
        {
          error: "Database error fetching filings",
          details: dbError.message,
          code: dbError.code,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Unhandled error in admin filings route:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch filings",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

