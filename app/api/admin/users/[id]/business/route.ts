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
    const { name, email, phone, address, website, industry, formationDate, ein, businessId } = await request.json()

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let business

    // If user already has a business, update it
    if (user.businessId) {
      business = await db.business.update({
        where: { id: user.businessId },
        data: {
          name,
          email,
          phone,
          address,
          website,
          industry,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          ein,
          businessId,
        },
      })
    } else {
      // If user doesn't have a business, create one
      business = await db.business.create({
        data: {
          name,
          email,
          phone,
          address,
          website,
          industry,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          ein,
          businessId,
          users: {
            connect: { id: userId },
          },
        },
      })
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error("Error updating business information:", error)
    return NextResponse.json({ error: "Failed to update business information" }, { status: 500 })
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

    // Find the user's business information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        business: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ business: user.business || null })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

