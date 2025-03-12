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
    const { name, businessId, ein, formationDate, serviceStatus, llcStatusMessage, llcProgress } = await request.json()

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
          businessId,
          ein,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          // Store custom fields in metadata or similar field if needed
          // For now, we'll just update the standard fields
        },
      })

      // Store the LLC status and progress in a custom way
      // This could be in a separate table or as metadata
      // For now, we'll just return them with the response
    } else {
      // If user doesn't have a business, create one
      business = await db.business.create({
        data: {
          name,
          businessId,
          ein,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          users: {
            connect: { id: userId },
          },
        },
      })

      // Update user with business relation
      await db.user.update({
        where: { id: userId },
        data: {
          businessId: business.id,
        },
      })
    }

    // Return the business with the custom fields
    return NextResponse.json({
      business: {
        ...business,
        serviceStatus,
        llcStatusMessage,
        llcProgress,
      },
    })
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

    // Return the business with custom fields
    // In a real app, you would fetch these from wherever they're stored
    return NextResponse.json({
      business: user.business
        ? {
            ...user.business,
            serviceStatus: "Pending", // Default value
            llcStatusMessage: "LLC formation initiated", // Default value
            llcProgress: 10, // Default value
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

