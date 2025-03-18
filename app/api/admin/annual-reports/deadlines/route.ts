import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all deadlines with user info
    const deadlines = await db.annualReportDeadline.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json({ deadlines: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Creating deadline with data:", data)

    // Validate required fields
    if (!data.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!data.dueDate) {
      return NextResponse.json({ error: "Due date is required" }, { status: 400 })
    }

    // Format the data correctly
    const deadlineData = {
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      dueDate: new Date(data.dueDate),
      fee: typeof data.fee === "string" ? Number.parseFloat(data.fee) : data.fee,
      lateFee: data.lateFee
        ? typeof data.lateFee === "string"
          ? Number.parseFloat(data.lateFee)
          : data.lateFee
        : null,
      status: data.status || "pending",
    }

    console.log("Formatted deadline data:", deadlineData)

    try {
      // Create a new deadline
      const deadline = await db.annualReportDeadline.create({
        data: deadlineData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      console.log("Deadline created successfully:", deadline)
      return NextResponse.json({ deadline })
    } catch (dbError: any) {
      console.error("Database error creating deadline:", dbError)

      // Return a more detailed error message
      return NextResponse.json(
        {
          error: "Database error creating deadline",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error creating deadline:", error)
    return NextResponse.json(
      {
        error: "Failed to create deadline",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

