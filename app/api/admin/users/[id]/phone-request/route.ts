import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Find the user's phone request
    const phoneRequest = await db.phoneNumberRequest.findFirst({
      where: { userId },
    })

    return NextResponse.json({ request: phoneRequest })
  } catch (error) {
    console.error("Error fetching phone request:", error)
    return NextResponse.json({ error: "Failed to fetch phone request" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const { phoneNumber, status } = await request.json()

    // Check if a request already exists
    const existingRequest = await db.phoneNumberRequest.findFirst({
      where: { userId },
    })

    let phoneRequest

    if (existingRequest) {
      // Update existing request
      phoneRequest = await db.phoneNumberRequest.update({
        where: { id: existingRequest.id },
        data: {
          phoneNumber,
          status,
        },
      })
    } else {
      // Create a new phone request
      phoneRequest = await db.phoneNumberRequest.create({
        data: {
          userId,
          phoneNumber,
          status,
        },
      })
    }

    return NextResponse.json({ request: phoneRequest })
  } catch (error) {
    console.error("Error updating phone request:", error)
    return NextResponse.json({ error: "Failed to update phone request" }, { status: 500 })
  }
}

