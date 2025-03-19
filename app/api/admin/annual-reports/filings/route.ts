import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

// Define a type for filings with related data using Prisma types
type FilingWithRelations = {
  id: string
  userId: string
  deadlineId: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  userNotes: string | null
  adminNotes: string | null
  filedDate: Date | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string
  } | null
  deadline: {
    id: string
    title: string
    dueDate: Date
    fee: any // Using any for Decimal type
    lateFee: any | null // Using any for Decimal type
    status: string
  } | null
  deadlineTitle?: string
  dueDate?: Date | null
  userName?: string
  userEmail?: string
}

export async function GET(req: Request) {
  console.log("Admin filings API: Starting request")

  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      console.log("Admin filings API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Admin filings API: Authentication successful, fetching filings")

    try {
      // Simplify the query to help identify issues
      const filings = await prisma.annualReportFiling.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deadline: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              fee: true,
              lateFee: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`Admin filings API: Successfully fetched ${filings.length} filings`)

      // Process filings to ensure all required data is present
      const processedFilings = filings.map((filing: FilingWithRelations) => {
        return {
          ...filing,
          // Ensure these fields are never undefined
          deadlineTitle: filing.deadline?.title || "Unknown Deadline",
          dueDate: filing.deadline?.dueDate || null,
          userName: filing.user?.name || "Unknown User",
          userEmail: filing.user?.email || "unknown@example.com",
        }
      })

      return NextResponse.json({ filings: processedFilings })
    } catch (dbError) {
      console.error("Admin filings API: Database error:", dbError)
      return NextResponse.json(
        {
          error: "Database error fetching filings",
          details: (dbError as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Admin filings API: Unhandled error:", error)
    return NextResponse.json(
      {
        error: "Error fetching filings",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

