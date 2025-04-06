import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    const userId = session.user.id

    // Fetch business data from the database
    const business = await db.business.findFirst({
      where: {
        userId: userId,
      },
    })

    return new Response(JSON.stringify({ business }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching business data:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch business data" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
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

    // Find the user's business
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        business: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let business = user.business

    if (!business) {
      // Try to find business by user ID
      business = await db.business.findFirst({
        where: {
          userId: session.user.id,
        },
      })
    }

    if (!business) {
      // Create a new business if it doesn't exist
      business = await db.business.create({
        data: {
          name: body.name || user.name || "My Business",
          userId: session.user.id,
          website: body.website || "",
          industry: body.industry || "Technology",
        },
      })
    } else {
      // Update the existing business
      business = await db.business.update({
        where: {
          id: business.id,
        },
        data: {
          website: body.website !== undefined ? body.website : business.website,
          industry: body.industry !== undefined ? body.industry : business.industry,
        },
      })
    }

    return NextResponse.json({ success: true, business }, { status: 200 })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
  }
}

