import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const { addressLine1, addressLine2, city, state, zipCode, country } = await request.json()

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { address: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let address

    // If user already has an address, update it
    if (user.address) {
      address = await db.userAddress.update({
        where: { userId: userId },
        data: {
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
          country: country || "United States",
        },
      })
    } else {
      // If user doesn't have an address, create one
      address = await db.userAddress.create({
        data: {
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
          country: country || "United States",
          user: {
            connect: { id: userId },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      address,
    })
  } catch (error) {
    console.error("Error updating user address:", error)
    return NextResponse.json({ error: "Failed to update user address" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Find the user's address information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        address: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      address: user.address || null,
    })
  } catch (error) {
    console.error("Error fetching user address:", error)
    return NextResponse.json({ error: "Failed to fetch user address" }, { status: 500 })
  }
}

