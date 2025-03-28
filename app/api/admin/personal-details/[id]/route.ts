import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - Not logged in" }, { status: 401 })
    }

    // Log session info for debugging
    console.log("Session user:", session.user)

    // Check if user has admin role
    // Based on the type error, we know user has a 'role' property
    const isAdmin = session.user.role === "admin"

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized - Not an admin" }, { status: 403 })
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // Get personal details with members
    const personalDetails = await prisma.personalDetails.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        members: true, // Include members data
      },
    })

    if (!personalDetails) {
      return NextResponse.json({ error: "Personal details not found" }, { status: 404 })
    }

    return NextResponse.json(personalDetails)
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Failed to fetch personal details" }, { status: 500 })
  }
}

