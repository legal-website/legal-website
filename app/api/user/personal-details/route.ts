import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define types for our models
type PersonalDetailsMember = {
  id: string
  personalDetailsId: string
  memberName: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl: string | null
  createdAt: Date
  updatedAt: Date
}

type PersonalDetails = {
  id: string
  userId: string
  clientName: string
  companyName: string
  currentAddress: string
  businessPurpose: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl: string | null
  status: "pending" | "approved" | "rejected"
  adminNotes: string | null
  isRedirectDisabled: boolean
  createdAt: Date
  updatedAt: Date
  members: PersonalDetailsMember[]
}

type MemberInput = {
  memberName: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl?: string | null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const personalDetails = await prisma.personalDetails.findUnique({
      where: { userId: user.id },
      include: {
        members: true,
      },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const data = await req.json()
    const {
      clientName,
      companyName,
      currentAddress,
      businessPurpose,
      idCardFrontUrl,
      idCardBackUrl,
      passportUrl,
      members,
    } = data

    // Validate required fields
    if (!clientName || !companyName || !currentAddress || !businessPurpose || !idCardFrontUrl || !idCardBackUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if personal details already exist for this user
    const existingDetails = await prisma.personalDetails.findUnique({
      where: { userId: user.id },
      include: { members: true },
    })

    let personalDetails: PersonalDetails | null = null

    if (existingDetails) {
      // Update existing personal details
      personalDetails = (await prisma.personalDetails.update({
        where: { id: existingDetails.id },
        data: {
          clientName,
          companyName,
          currentAddress,
          businessPurpose,
          idCardFrontUrl,
          idCardBackUrl,
          passportUrl,
          status: "pending", // Reset status to pending when updated
          adminNotes: null,
        },
        include: { members: true },
      })) as PersonalDetails

      // Delete existing members
      if (existingDetails.members.length > 0) {
        await prisma.personalDetailsMember.deleteMany({
          where: { personalDetailsId: existingDetails.id },
        })
      }

      // Add new members if provided
      if (members && members.length > 0) {
        const memberPromises = members.map((member: MemberInput) => {
          return prisma.personalDetailsMember.create({
            data: {
              personalDetailsId: personalDetails!.id,
              memberName: member.memberName,
              idCardFrontUrl: member.idCardFrontUrl,
              idCardBackUrl: member.idCardBackUrl,
              passportUrl: member.passportUrl || null,
            },
          })
        })

        await Promise.all(memberPromises)

        // Fetch updated details with members
        personalDetails = (await prisma.personalDetails.findUnique({
          where: { id: personalDetails.id },
          include: { members: true },
        })) as PersonalDetails
      }
    } else {
      // Create new personal details
      personalDetails = (await prisma.personalDetails.create({
        data: {
          userId: user.id,
          clientName,
          companyName,
          currentAddress,
          businessPurpose,
          idCardFrontUrl,
          idCardBackUrl,
          passportUrl,
          status: "pending",
          isRedirectDisabled: false,
        },
        include: { members: true },
      })) as PersonalDetails

      // Add members if provided
      if (members && members.length > 0) {
        const memberPromises = members.map((member: MemberInput) => {
          return prisma.personalDetailsMember.create({
            data: {
              personalDetailsId: personalDetails!.id,
              memberName: member.memberName,
              idCardFrontUrl: member.idCardFrontUrl,
              idCardBackUrl: member.idCardBackUrl,
              passportUrl: member.passportUrl || null,
            },
          })
        })

        await Promise.all(memberPromises)

        // Fetch updated details with members
        personalDetails = (await prisma.personalDetails.findUnique({
          where: { id: personalDetails.id },
          include: { members: true },
        })) as PersonalDetails
      }
    }

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error submitting personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

