import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

// Define more explicit types with optional properties
interface User {
  id: string
  name: string | null
  email: string
}

interface Deadline {
  id: string
  title: string
  dueDate: Date
  fee: any
  lateFee: any | null
  status: string
}

interface Filing {
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
      // First, try to get the filings without includes to check if that works
      const basicFilings = await prisma.annualReportFiling.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`Admin filings API: Successfully fetched ${basicFilings.length} basic filings`)

      // Now try to get the user data separately
      const userIds = [...new Set(basicFilings.map((filing: Filing) => filing.userId))]
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      // Create a map for quick user lookup
      const userMap = new Map(users.map((user: User) => [user.id, user]))

      // Now try to get the deadline data separately
      const deadlineIds = [...new Set(basicFilings.map((filing: Filing) => filing.deadlineId))]
      const deadlines = await prisma.annualReportDeadline.findMany({
        where: {
          id: {
            in: deadlineIds,
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          fee: true,
          lateFee: true,
          status: true,
        },
      })

      // Create a map for quick deadline lookup
      const deadlineMap = new Map(deadlines.map((deadline: Deadline) => [deadline.id, deadline]))

      // Now manually combine the data with proper type checking
      const processedFilings = basicFilings.map((filing: any) => {
        const user = userMap.get(filing.userId) as User | undefined
        const deadline = deadlineMap.get(filing.deadlineId) as Deadline | undefined

        return {
          ...filing,
          user: user || null,
          deadline: deadline || null,
          // Ensure these fields are never undefined
          deadlineTitle: deadline ? deadline.title : "Unknown Deadline",
          dueDate: deadline ? deadline.dueDate : null,
          userName: user && user.name ? user.name : "Unknown User",
          userEmail: user && user.email ? user.email : "unknown@example.com",
        }
      })

      return NextResponse.json({ filings: processedFilings })
    } catch (dbError) {
      console.error("Admin filings API: Database error:", dbError)
      return NextResponse.json(
        {
          error: "Database error fetching filings",
          details: (dbError as Error).message,
          stack: process.env.NODE_ENV === "development" ? (dbError as Error).stack : undefined,
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
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}

