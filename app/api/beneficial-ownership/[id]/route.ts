import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

// GET a specific beneficial owner
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === UserRole.ADMIN
    const ownerId = params.id

    const owner = await prisma.beneficialOwner.findUnique({
      where: {
        id: ownerId,
      },
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

    if (!owner) {
      return NextResponse.json({ error: "Beneficial owner not found" }, { status: 404 })
    }

    // Check if user has permission to view this owner
    if (!isAdmin && owner.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ owner })
  } catch (error) {
    console.error("Error fetching beneficial owner:", error)
    return NextResponse.json(
      { error: "Failed to fetch beneficial owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

// PUT to update a beneficial owner
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === UserRole.ADMIN
    const ownerId = params.id
    const data = await req.json()

    // Find the owner to update
    const owner = await prisma.beneficialOwner.findUnique({
      where: {
        id: ownerId,
      },
    })

    if (!owner) {
      return NextResponse.json({ error: "Beneficial owner not found" }, { status: 404 })
    }

    // Check if user has permission to update this owner
    if (!isAdmin && owner.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // For non-default owners or admin updates
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Admin can update any field
    if (isAdmin) {
      if (data.name) updateData.name = data.name
      if (data.title) updateData.title = data.title
      if (data.ownershipPercentage !== undefined) updateData.ownershipPercentage = Number(data.ownershipPercentage)
      if (data.status) updateData.status = data.status
    } else {
      // Clients can update name, title, and ownershipPercentage
      if (data.name) updateData.name = data.name
      if (data.title) updateData.title = data.title

      if (data.ownershipPercentage !== undefined) {
        updateData.ownershipPercentage = Number(data.ownershipPercentage)
        updateData.status = "pending" // Set status to pending when client updates
      }
    }

    // Update the owner without additional validation
    // The client will handle the validation of total ownership
    const updatedOwner = await prisma.beneficialOwner.update({
      where: {
        id: ownerId,
      },
      data: updateData,
    })

    return NextResponse.json({
      owner: updatedOwner,
      message: "Beneficial owner updated successfully",
    })
  } catch (error) {
    console.error("Error updating beneficial owner:", error)
    return NextResponse.json(
      { error: "Failed to update beneficial owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

// DELETE a beneficial owner
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === UserRole.ADMIN
    const ownerId = params.id

    // Find the owner to delete
    const owner = await prisma.beneficialOwner.findUnique({
      where: {
        id: ownerId,
      },
    })

    if (!owner) {
      return NextResponse.json({ error: "Beneficial owner not found" }, { status: 404 })
    }

    // Check if user has permission to delete this owner
    if (!isAdmin && owner.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Don't allow deleting the default owner
    if (owner.isDefault) {
      return NextResponse.json({ error: "Cannot delete the primary owner" }, { status: 400 })
    }

    // Delete the owner - no need to validate ownership percentages here
    // as the client will handle updating the default owner's percentage
    await prisma.beneficialOwner.delete({
      where: {
        id: ownerId,
      },
    })

    return NextResponse.json({ message: "Beneficial owner deleted successfully" })
  } catch (error) {
    console.error("Error deleting beneficial owner:", error)
    return NextResponse.json(
      { error: "Failed to delete beneficial owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

