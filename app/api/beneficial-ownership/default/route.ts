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

// POST to create default owner for the current user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if default owner already exists
    const existingDefault = await prisma.beneficialOwner.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    })

    if (existingDefault) {
      return NextResponse.json({ error: "Default owner already exists", owner: existingDefault }, { status: 400 })
    }

    // Create default owner
    const defaultOwner = await prisma.beneficialOwner.create({
      data: {
        userId: session.user.id,
        name: session.user.name || "Primary Owner",
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
    })
  } catch (error) {
    console.error("Error creating default owner:", error)
    return NextResponse.json(
      { error: "Failed to create default owner", details: (error as Error).message },
      { status: 500 },
    )
  }
}

