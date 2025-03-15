import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const data = await request.json()

    // Update or create the account manager request
    const accountManagerRequest = await prisma.accountManagerRequest.upsert({
      where: {
        userId,
      },
      update: {
        status: data.status,
        managerName: data.managerName,
        contactLink: data.contactLink,
      },
      create: {
        userId,
        status: data.status,
        managerName: data.managerName,
        contactLink: data.contactLink,
      },
    })

    return NextResponse.json({ request: accountManagerRequest })
  } catch (error) {
    console.error("Error updating account manager request:", error)
    return NextResponse.json({ error: "Failed to update account manager request" }, { status: 500 })
  }
}

