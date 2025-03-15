import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Use type assertion to bypass TypeScript errors
    const existingRequest = await (prisma as any).accountManagerRequest.findFirst({
      where: {
        userId: userId,
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { message: "Account manager request already exists", request: existingRequest },
        { status: 200 },
      )
    }

    // Use type assertion for create operation
    const newRequest = await (prisma as any).accountManagerRequest.create({
      data: {
        userId: userId,
        status: "requested",
      },
    })

    return NextResponse.json({ message: "Request submitted successfully", request: newRequest }, { status: 201 })
  } catch (error) {
    console.error("Error creating account manager request:", error)
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Use type assertion
    const managerRequest = await (prisma as any).accountManagerRequest.findFirst({
      where: {
        userId: userId,
      },
    })

    return NextResponse.json({ request: managerRequest || null }, { status: 200 })
  } catch (error) {
    console.error("Error fetching account manager request:", error)
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}

