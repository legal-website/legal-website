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
    const {
      name,
      businessId,
      ein,
      formationDate,
      serviceStatus,
      llcStatusMessage,
      llcProgress,
      annualReportFee,
      annualReportFrequency,
      annualReportDate,
    } = await request.json()

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let business

    // Store custom data as JSON in industry field
    const customData = JSON.stringify({
      serviceStatus,
      llcStatusMessage,
      llcProgress,
      annualReportFee,
      annualReportFrequency,
      annualReportDate,
    })

    // If user already has a business, update it
    if (user.businessId) {
      business = await db.business.update({
        where: { id: user.businessId },
        data: {
          name,
          businessId,
          ein,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          industry: customData,
        },
      })
    } else {
      // If user doesn't have a business, create one
      business = await db.business.create({
        data: {
          name,
          businessId,
          ein,
          formationDate: formationDate ? new Date(formationDate) : undefined,
          industry: customData,
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
      success: true,
      business: {
        ...business,
        serviceStatus,
        llcStatusMessage,
        llcProgress,
        annualReportFee,
        annualReportFrequency,
        annualReportDate,
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

    // Parse custom data from industry field
    let customData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
      annualReportFee: 100,
      annualReportFrequency: 1,
      annualReportDate: null,
    }

    if (user.business?.industry) {
      try {
        const parsedData = JSON.parse(user.business.industry as string)
        customData = { ...customData, ...parsedData }
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    // Return the business with custom fields
    return NextResponse.json({
      business: user.business
        ? {
            ...user.business,
            serviceStatus: customData.serviceStatus,
            llcStatusMessage: customData.llcStatusMessage,
            llcProgress: customData.llcProgress,
            annualReportFee: customData.annualReportFee,
            annualReportFrequency: customData.annualReportFrequency,
            annualReportDate: customData.annualReportDate,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

