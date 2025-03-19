import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

// GET all beneficial owners (admin) or user's beneficial owners (client)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === UserRole.ADMIN

    // If admin, get all owners with user info
    if (isAdmin) {
      const owners = await prisma.beneficialOwner.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              business: true,
            },
          },
        },
        orderBy: {
          dateAdded: "desc",
        },
      })

      return NextResponse.json({ owners })
    } else {
      // If client, get only their owners
      const owners = await prisma.beneficialOwner.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            ownershipPercentage: "desc",
          },
        ],
      })

      return NextResponse.json({ owners })
    }
  } catch (error) {
    console.error("Error fetching beneficial owners:", error)
    return NextResponse.json(
      { error: "Failed to fetch beneficial owners", details: (error as Error).message },
      { status: 500 },
    )
  }
}

// POST to create a new beneficial owner
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { name, title, ownershipPercentage } = data

    // Validate required fields
    if (!name || !title || ownershipPercentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, title, and ownershipPercentage are required" },
        { status: 400 },
      )
    }

    // Get current owners to validate ownership percentages
    const currentOwners = await prisma.beneficialOwner.findMany({
      where: {
        userId: session.user.id,
      },
    })

    // Calculate total ownership after adding new owner
    const currentTotal = currentOwners.reduce((sum: number, owner: any) => sum + Number(owner.ownershipPercentage), 0)
    const newTotal = currentTotal + Number(ownershipPercentage)

    if (newTotal > 100) {
      return NextResponse.json({ error: "Total ownership percentage cannot exceed 100%" }, { status: 400 })
    }

    // Create the new owner
    const newOwner = await prisma.beneficialOwner.create({
      data: {
        userId: session.user.id,
        name,
        title,
        ownershipPercentage: Number(ownershipPercentage),
        status: "pending",
        isDefault: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ owner: newOwner, message: "Beneficial owner added successfully" })
  } catch (error) {
    console.error("Error creating beneficial owner:", error)
    return NextResponse.json(
      { error: "Failed to create beneficial owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

