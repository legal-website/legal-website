import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any)?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Get user address
    const address = await db.userAddress.findUnique({
      where: { userId },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error fetching user address:", error)
    return NextResponse.json({ error: "Failed to fetch user address" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any)?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const data = await request.json()

    // Validate required fields
    if (!data.addressLine1 || !data.city || !data.state || !data.zipCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert user address (create if doesn't exist, update if it does)
    const address = await db.userAddress.upsert({
      where: { userId },
      update: {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || "United States",
      },
      create: {
        userId,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || "United States",
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error updating user address:", error)
    return NextResponse.json({ error: "Failed to update user address" }, { status: 500 })
  }
}

