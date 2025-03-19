import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
  deadline?: Deadline | null
}

export async function GET(req: Request) {
  console.log("Client filings API: Starting request")

  try {
    // Step 1: Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log("Client filings API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Client filings API: Authentication successful, fetching filings for user", session.user.id)

    try {
      // Step 2: First, try to get the filings without includes to check if that works
      console.log("Client filings API: Fetching basic filings without includes")
      const basicFilings = await prisma.annualReportFiling.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`Client filings API: Successfully fetched ${basicFilings.length} basic filings`)

      // Step 3: Now try to get the deadline data separately
      console.log("Client filings API: Fetching deadlines for filings")
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

      console.log(`Client filings API: Successfully fetched ${deadlines.length} deadlines`)

      // Create a map for quick deadline lookup
      const deadlineMap = new Map(deadlines.map((deadline: Deadline) => [deadline.id, deadline]))

      // Step 4: Now manually combine the data with proper type checking
      console.log("Client filings API: Processing filings data")
      const processedFilings = basicFilings.map((filing: Filing) => {
        const deadline = deadlineMap.get(filing.deadlineId) as Deadline | undefined

        return {
          ...filing,
          deadline: deadline || null,
          // Ensure these fields are never undefined
          deadlineTitle: deadline ? deadline.title : "Unknown Deadline",
          dueDate: deadline ? deadline.dueDate : null,
        }
      })

      console.log(`Client filings API: Successfully processed ${processedFilings.length} filings`)
      return NextResponse.json({ filings: processedFilings })
    } catch (dbError) {
      console.error("Client filings API: Database error:", dbError)
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
    console.error("Client filings API: Unhandled error:", error)
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Creating filing with data:", data)

    // Validate required fields
    if (!data.deadlineId) {
      return NextResponse.json({ error: "Deadline ID is required" }, { status: 400 })
    }

    if (!data.receiptUrl) {
      return NextResponse.json({ error: "Receipt URL is required" }, { status: 400 })
    }

    // Get the deadline to include in the response
    const deadline = await prisma.annualReportDeadline.findUnique({
      where: { id: data.deadlineId },
      select: {
        id: true,
        title: true,
        dueDate: true,
        fee: true,
        lateFee: true,
        status: true,
      },
    })

    if (!deadline) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 })
    }

    // Create a new filing
    try {
      const filing = await prisma.annualReportFiling.create({
        data: {
          userId: session.user.id,
          deadlineId: data.deadlineId,
          receiptUrl: data.receiptUrl,
          userNotes: data.userNotes || null,
          status: "pending_payment",
          updatedAt: new Date(), // Ensure updatedAt is set
        },
      })

      console.log("Filing created successfully:", filing)

      // Update the deadline status
      await prisma.annualReportDeadline.update({
        where: { id: data.deadlineId },
        data: { status: "pending_payment" },
      })

      // Return the filing with the deadline data
      return NextResponse.json({
        filing: {
          ...filing,
          deadline,
          deadlineTitle: deadline.title,
          dueDate: deadline.dueDate,
        },
      })
    } catch (dbError: any) {
      console.error("Database error creating filing:", dbError)
      console.error("Error code:", dbError.code)
      console.error("Error message:", dbError.message)

      if (dbError.meta) {
        console.error("Error meta:", dbError.meta)
      }

      return NextResponse.json(
        {
          error: "Database error creating filing",
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error creating filing:", error)
    return NextResponse.json(
      {
        error: "Failed to create filing",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

