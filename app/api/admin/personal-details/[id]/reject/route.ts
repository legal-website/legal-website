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
    console.log("Reject request body:", body)

    const id = params.id
    const adminNotes = body.adminNotes || ""

    // Update the personal details status to rejected
    const updatedDetails = await prisma.personalDetails.update({
      where: {
        id,
      },
      data: {
        status: "rejected",
        adminNotes,
      },
    })

    return NextResponse.json({
      message: "Personal details rejected successfully",
      personalDetails: updatedDetails,
    })
  } catch (error) {
    console.error("Error rejecting personal details:", error)
    return NextResponse.json({ error: "Failed to reject personal details" }, { status: 500 })
  }
}

