import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

// PUT to update the status of a beneficial owner (admin only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ownerId = params.id
    const data = await req.json()
    const { status } = data

    if (!status || !["pending", "reported"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be 'pending' or 'reported'" }, { status: 400 })
    }

    // Find the owner to update
    const owner = await prisma.beneficialOwner.findUnique({
      where: {
        id: ownerId,
      },
    })

    if (!owner) {
      return NextResponse.json({ error: "Beneficial owner not found" }, { status: 404 })
    }

    // Update the status
    const updatedOwner = await prisma.beneficialOwner.update({
      where: {
        id: ownerId,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      owner: updatedOwner,
      message: `Beneficial owner status updated to ${status}`,
    })
  } catch (error) {
    console.error("Error updating beneficial owner status:", error)
    return NextResponse.json(
      { error: "Failed to update beneficial owner status", details: (error as Error).message },
      { status: 500 },
    )
  }
}

