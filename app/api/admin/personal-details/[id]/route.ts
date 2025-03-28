import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // First delete all members associated with this personal details record
    await prisma.personalDetailsMember.deleteMany({
      where: {
        personalDetailsId: id,
      },
    })

    // Then delete the personal details record
    const deletedRecord = await prisma.personalDetails.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: "Personal details deleted successfully", id }, { status: 200 })
  } catch (error) {
    console.error("Error deleting personal details:", error)
    return NextResponse.json({ error: "Failed to delete personal details" }, { status: 500 })
  }
}

// Keep existing route handlers (GET, PATCH, etc.) if they exist

