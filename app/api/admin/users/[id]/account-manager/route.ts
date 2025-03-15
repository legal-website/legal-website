import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const data = await request.json()

    // Validate required fields
    if (data.status === "approved" && (!data.managerName || !data.contactLink)) {
      return NextResponse.json({ error: "Manager name and contact link are required for approval" }, { status: 400 })
    }

    // Use type assertion
    const existingRequest = await (prisma as any).accountManagerRequest.findFirst({
      where: {
        userId: userId,
      },
    })

    let updatedRequest

    if (existingRequest) {
      // Use type assertion for update
      updatedRequest = await (prisma as any).accountManagerRequest.update({
        where: {
          id: existingRequest.id,
        },
        data: {
          status: data.status,
          managerName: data.managerName,
          contactLink: data.contactLink,
          updatedAt: new Date(),
        },
      })
    } else {
      // Use type assertion for create
      updatedRequest = await (prisma as any).accountManagerRequest.create({
        data: {
          userId: userId,
          status: data.status,
          managerName: data.managerName,
          contactLink: data.contactLink,
        },
      })
    }

    return NextResponse.json({ message: "Account manager request updated", request: updatedRequest }, { status: 200 })
  } catch (error) {
    console.error("Error updating account manager request:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

