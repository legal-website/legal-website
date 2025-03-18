import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get a user ID to use for the test
    const user = await prisma.user.findFirst({
      where: {
        role: "CLIENT",
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "No client user found" }, { status: 404 })
    }

    // Create a test deadline with hardcoded values
    try {
      const deadline = await prisma.annualReportDeadline.create({
        data: {
          userId: user.id,
          title: "Test Deadline",
          description: "This is a test deadline",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          fee: new Decimal("75.00"),
          lateFee: new Decimal("25.00"),
          status: "pending",
        },
      })

      return NextResponse.json({ success: true, deadline })
    } catch (dbError: any) {
      console.error("Database error creating test deadline:", dbError)
      console.error("Error code:", dbError.code)
      console.error("Error message:", dbError.message)

      if (dbError.meta) {
        console.error("Error meta:", dbError.meta)
      }

      return NextResponse.json(
        {
          error: "Database error creating test deadline",
          details: dbError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in test deadline route:", error)
    return NextResponse.json(
      {
        error: "Failed to create test deadline",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

