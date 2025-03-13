import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user's phone request
    const phoneRequest = await db.phoneNumberRequest.findFirst({
      where: { userId: session.user.id as string },
    })

    return NextResponse.json({ request: phoneRequest })
  } catch (error) {
    console.error("Error fetching phone request:", error)
    return NextResponse.json({ error: "Failed to fetch phone request" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, status } = await request.json()

    // Verify the user is requesting for themselves
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if a request already exists
    const existingRequest = await db.phoneNumberRequest.findFirst({
      where: { userId: userId },
    })

    if (existingRequest) {
      return NextResponse.json({
        request: existingRequest,
        message: "Phone number request already exists",
      })
    }

    // Create a new phone request
    const phoneRequest = await db.phoneNumberRequest.create({
      data: {
        userId,
        status,
      },
    })

    return NextResponse.json({ request: phoneRequest })
  } catch (error) {
    console.error("Error creating phone request:", error)
    return NextResponse.json({ error: "Failed to create phone request" }, { status: 500 })
  }
}

