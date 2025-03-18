import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

// Define types for our data
interface User {
  id: string
  name: string | null
  email: string
}

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
  user?: {
    name: string | null
    email: string
  }
  deadline?: {
    id: string
    title: string
    dueDate: string | Date
    fee: number
    lateFee: number | null
    status: string
  }
}

export async function GET(req: Request) {
  console.log("Admin filings API: Starting request")

  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch filings with complete deadline and user data
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

    // Process filings to ensure all required data is present
    const processedFilings = filings.map((filing: Filing) => {
      return {
        ...filing,
        // Ensure these fields are never undefined
        deadlineTitle: filing.deadline?.title || "Unknown Deadline",
        dueDate: filing.deadline?.dueDate || null,
        userName: filing.user?.name || "Unknown User",
        userEmail: filing.user?.email || "unknown@example.com",
      }
    })

    console.log(`Admin filings API: Successfully fetched ${filings.length} filings`)

    return NextResponse.json({ filings: processedFilings })
  } catch (error) {
    console.error("Admin filings API: Error:", error)
    return NextResponse.json(
      {
        error: "Error fetching filings",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

