import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user's business
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        business: true,
      },
    })

    if (!user || !user.business) {
      // Try to find business by user ID
      const business = await db.$queryRawUnsafe(
        `SELECT * FROM Business WHERE id IN (SELECT businessId FROM User WHERE id = ?)`,
        session.user.id,
      )

      if (!business || !business[0]) {
        return NextResponse.json({ business: null }, { status: 200 })
      }

      return NextResponse.json({ business: business[0] }, { status: 200 })
    }

    return NextResponse.json({ business: user.business }, { status: 200 })
  } catch (error) {
    console.error("Error fetching business:", error)
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()

    // Find the user
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        businessId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let business

    // Check if user has a business
    if (user.businessId) {
      // Get the business
      const existingBusiness = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, user.businessId)

      if (existingBusiness && existingBusiness[0]) {
        // Check if we need to set completedAt
        const completedAt =
          body.llcProgress === 100 && !existingBusiness[0].completedAt
            ? new Date()
            : existingBusiness[0].completedAt || null

        // Update the existing business
        business = await db.$executeRawUnsafe(
          `UPDATE Business SET 
           website = ?, 
           industry = ?, 
           completedAt = ? 
           WHERE id = ?`,
          body.website !== undefined ? body.website : existingBusiness[0].website,
          body.industry !== undefined ? body.industry : existingBusiness[0].industry,
          completedAt,
          user.businessId,
        )

        // Fetch the updated business
        business = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, user.businessId)
        business = business[0]
      }
    }

    if (!business) {
      // Create a new business
      const newBusinessId = generateUUID()
      await db.$executeRawUnsafe(
        `INSERT INTO Business (id, name, userId, website, industry, completedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        newBusinessId,
        body.name || user.name || "My Business",
        session.user.id,
        body.website || "",
        body.industry || "Technology",
        body.llcProgress === 100 ? new Date() : null,
      )

      // Update user with business relation
      await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, newBusinessId, session.user.id)

      // Fetch the new business
      business = await db.$queryRawUnsafe(`SELECT * FROM Business WHERE id = ?`, newBusinessId)
      business = business[0]
    }

    return NextResponse.json({ success: true, business }, { status: 200 })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
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

