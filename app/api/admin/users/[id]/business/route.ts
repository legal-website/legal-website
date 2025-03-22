import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role" // Import from local file instead of @prisma/client

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
      completedAt,
    } = await request.json()

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        businessId: true,
      },
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
    })

    // Calculate completedAt value
    const completedAtValue = completedAt ? new Date(completedAt) : llcProgress === 100 ? new Date() : null

    // If user already has a business, update it
    if (user.businessId) {
      await db.$executeRawUnsafe(
        `UPDATE Business SET 
         name = ?, 
         ein = ?, 
         formationDate = ?, 
         industry = ?,
         completedAt = ?
         WHERE id = ?`,
        name,
        ein,
        formationDate ? new Date(formationDate) : null,
        customData,
        completedAtValue,
        user.businessId,
      )

      // Fetch the updated business
      const updatedBusiness = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, user.businessId)
      business = updatedBusiness[0]
    } else {
      // If user doesn't have a business, create one
      const newBusinessId = businessId || generateUUID()

      await db.$executeRawUnsafe(
        `INSERT INTO Business (id, name, businessId, ein, formationDate, industry, completedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        newBusinessId,
        name,
        newBusinessId,
        ein,
        formationDate ? new Date(formationDate) : null,
        customData,
        completedAtValue,
      )

      // Update user with business relation
      await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, newBusinessId, userId)

      // Fetch the new business
      const newBusiness = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, newBusinessId)
      business = newBusiness[0]
    }

    // Return the business with the custom fields
    return NextResponse.json({
      business: {
        ...business,
        serviceStatus,
        llcStatusMessage,
        llcProgress,
        annualReportFee,
        annualReportFrequency,
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
      select: {
        id: true,
        businessId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let business = null

    if (user.businessId) {
      // Fetch the business
      const businessData = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, user.businessId)

      if (businessData && businessData[0]) {
        business = businessData[0]
      }
    }

    // Parse custom data from industry field
    let customData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
      annualReportFee: 100,
      annualReportFrequency: 1,
    }

    if (business?.industry) {
      try {
        const parsedData = JSON.parse(business.industry as string)
        customData = { ...customData, ...parsedData }
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    // Return the business with custom fields
    return NextResponse.json({
      business: business
        ? {
            ...business,
            serviceStatus: customData.serviceStatus,
            llcStatusMessage: customData.llcStatusMessage,
            llcProgress: customData.llcProgress,
            annualReportFee: customData.annualReportFee,
            annualReportFrequency: customData.annualReportFrequency,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching business information:", error)
    return NextResponse.json({ error: "Failed to fetch business information" }, { status: 500 })
  }
}

// Helper function to generate UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

