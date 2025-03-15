import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get the account manager request for the user
    const accountManagerRequest = await prisma.accountManagerRequest.findFirst({
      where: {
        userId,
      },
    })

    return NextResponse.json({ request: accountManagerRequest || null })
  } catch (error) {
    console.error("Error fetching account manager request:", error)
    return NextResponse.json({ error: "Failed to fetch account manager request" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if a request already exists
    const existingRequest = await prisma.accountManagerRequest.findFirst({
      where: {
        userId,
      },
    })

    if (existingRequest) {
      return NextResponse.json({ request: existingRequest })
    }

    // Create a new account manager request
    const newRequest = await prisma.accountManagerRequest.create({
      data: {
        userId,
        status: "requested",
      },
    })

    return NextResponse.json({ request: newRequest })
  } catch (error) {
    console.error("Error creating account manager request:", error)
    return NextResponse.json({ error: "Failed to create account manager request" }, { status: 500 })
  }
}

