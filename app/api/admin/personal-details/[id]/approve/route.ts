import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Log request body for debugging
    const body = await request.json().catch(() => ({}))
    console.log("Approve request body:", body)

    const id = params.id
    const adminNotes = body.adminNotes || ""

    // Update the personal details status to approved
    const updatedDetails = await prisma.personalDetails.update({
      where: {
        id,
      },
      data: {
        status: "approved",
        adminNotes,
      },
    })

    return NextResponse.json({
      message: "Personal details approved successfully",
      personalDetails: updatedDetails,
    })
  } catch (error) {
    console.error("Error approving personal details:", error)
    return NextResponse.json({ error: "Failed to approve personal details" }, { status: 500 })
  }
}

