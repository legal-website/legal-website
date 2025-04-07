import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET to check if default owner exists for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if default owner exists
    const defaultOwner = await prisma.beneficialOwner.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    })

    if (defaultOwner) {
      return NextResponse.json({ exists: true, owner: defaultOwner })
    } else {
      return NextResponse.json({ exists: false })
    }
  } catch (error) {
    console.error("Error checking default owner:", error)
    return NextResponse.json(
      { error: "Failed to check default owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

// Update the POST method to accept a userId parameter
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    // Use provided userId or fall back to session user
    const userId = body.userId || session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized or missing userId" }, { status: 401 })
    }

    // Check if default owner already exists
    const existingDefault = await prisma.beneficialOwner.findFirst({
      where: {
        userId: userId,
        isDefault: true,
      },
    })

    if (existingDefault) {
      return NextResponse.json({ error: "Default owner already exists", owner: existingDefault }, { status: 400 })
    }

    // Get user name if available
    let userName = "Primary Owner"
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })
      if (user?.name) {
        userName = user.name
      }
    } catch (error) {
      console.error("Error fetching user name:", error)
    }

    // Create default owner
    const defaultOwner = await prisma.beneficialOwner.create({
      data: {
        userId: userId,
        name: userName,
        title: "CEO",
        ownershipPercentage: 100,
        status: "reported", // Default owner is automatically reported
        isDefault: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      owner: defaultOwner,
      message: "Default beneficial owner created successfully",
      isNew: true,
    })
  } catch (error) {
    console.error("Error creating default owner:", error)
    return NextResponse.json(
      { error: "Failed to create default owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

