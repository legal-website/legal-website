import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get a user ID to use for the test
    const user = await prisma.user.findFirst({
      select: {
        id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 })
    }

    // Create a minimal deadline
    try {
      const deadline = await prisma.annualReportDeadline.create({
        data: {
          userId: user.id,
          title: "Minimal Test Deadline",
          dueDate: new Date(),
          fee: "75.00", // Using string instead of Decimal
          status: "pending",
        },
      })

      return NextResponse.json({
        success: true,
        deadline,
        message: "Minimal deadline created successfully",
      })
    } catch (error: any) {
      console.error("Error creating minimal deadline:", error)
      return NextResponse.json(
        {
          error: "Failed to create minimal deadline",
          details: error.message,
          code: error.code,
          meta: error.meta,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in minimal deadline route:", error)
    return NextResponse.json(
      {
        error: "Failed to run minimal deadline test",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

