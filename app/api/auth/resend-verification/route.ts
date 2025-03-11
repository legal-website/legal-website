import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import { sendVerificationEmail } from "@/lib/auth-service"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // For security reasons, don't reveal if the user exists
      return NextResponse.json({ success: true })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        identifier: email,
      },
    })

    // Create a new verification token
    const verificationToken = uuidv4()
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        identifier: email,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userId: user.id,
      },
    })

    // Send verification email
    await sendVerificationEmail(email, user.name || "User", verificationToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

