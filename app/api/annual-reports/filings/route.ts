import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define types for our data
interface Deadline {
  id: string
  title: string
  dueDate: string | Date
  fee: number
  lateFee: number | null
  status: string
}

interface Filing {
  id: string
  userId: string
  deadlineId: string
  status: string
  createdAt: string | Date
  updatedAt: string | Date
  receiptUrl: string | null
  reportUrl: string | null
  filedDate: string | Date | null
  userNotes: string | null
  adminNotes: string | null
  deadline?: {
    id: string
    title: string
    dueDate: string | Date
    fee: number
    lateFee: number | null
    status: string
  } | null
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get filings for the current user with complete deadline data
    const filings = await prisma.annualReportFiling.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
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

    // Process filings to ensure all required data is present
    const processedFilings = filings.map((filing: Filing) => {
      return {
        ...filing,
        deadlineTitle: filing.deadline?.title || "Unknown Deadline",
        dueDate: filing.deadline?.dueDate || null,
      }
    })

    console.log(`Client API: Found ${filings.length} filings for user ${session.user.id}`)

    return NextResponse.json({ filings: processedFilings })
  } catch (error) {
    console.error("Error fetching filings:", error)
    return NextResponse.json({ filings: [] }, { status: 200 })
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

