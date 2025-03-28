import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the request body
    const body = await req.json()

    // Validate required fields
    const requiredFields = [
      "clientName",
      "companyName",
      "currentAddress",
      "businessPurpose",
      "idCardFrontUrl",
      "idCardBackUrl",
      "passportUrl",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Check if personal details already exist for this user
    const existingDetails = await db.personalDetails.findFirst({
      where: { userId: user.id },
    })

    let personalDetails

    if (existingDetails) {
      // Update existing record
      personalDetails = await db.personalDetails.update({
        where: { id: existingDetails.id },
        data: {
          clientName: body.clientName,
          companyName: body.companyName,
          currentAddress: body.currentAddress,
          businessPurpose: body.businessPurpose,
          idCardFrontUrl: body.idCardFrontUrl,
          idCardBackUrl: body.idCardBackUrl,
          passportUrl: body.passportUrl,
          status: "pending", // Reset to pending if resubmitting
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new record
      personalDetails = await db.personalDetails.create({
        data: {
          userId: user.id,
          clientName: body.clientName,
          companyName: body.companyName,
          currentAddress: body.currentAddress,
          businessPurpose: body.businessPurpose,
          idCardFrontUrl: body.idCardFrontUrl,
          idCardBackUrl: body.idCardBackUrl,
          passportUrl: body.passportUrl,
          status: "pending",
          isRedirectDisabled: false,
        },
      })
    }

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error submitting personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find personal details for the user
    const personalDetails = await db.personalDetails.findFirst({
      where: { userId: user.id },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

