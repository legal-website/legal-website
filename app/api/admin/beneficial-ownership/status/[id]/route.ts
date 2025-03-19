import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

// PUT to update a beneficial owner's status (admin only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === UserRole.ADMIN

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const ownerId = params.id
    const data = await req.json()
    const { status } = data

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
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

    // Update the owner's status
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
      message: "Beneficial owner status updated successfully",
    })
  } catch (error) {
    console.error("Error updating beneficial owner status:", error)
    return NextResponse.json(
      { error: "Failed to update beneficial owner status", details: (error as Error).message },
      { status: 500 },
    )
  }
}

