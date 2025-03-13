import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a reset token
    const resetToken = uuidv4()
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Create a verification token for password reset
    const token = await prisma.verificationToken.create({
      data: {
        token: resetToken,
        identifier: `reset-${user.email}`,
        expires,
        userId: user.id,
      },
    })

    // Send password reset email
    // This would typically be done here, but we'll assume it's handled elsewhere

    // Count the number of password reset requests for this user
    const resetCount = await prisma.verificationToken.count({
      where: {
        userId: user.id,
      },
    })

    // Return success with the reset count and the current time
    return NextResponse.json({
      success: true,
      resetCount,
      resetTime: token.expires.toISOString(), // Use the token's expires time as the reset timestamp
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

