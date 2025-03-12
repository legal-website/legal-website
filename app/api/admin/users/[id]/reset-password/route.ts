import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"
import { getAppUrl } from "@/lib/get-app-url"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a password reset token
    const resetToken = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    // Store the token in your database using the correct model
    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token: resetToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userId: userId, // Connect to the user using the userId field
      },
    })

    // Get the app URL
    const appUrl = getAppUrl()
    console.log("App URL:", appUrl) // Debug log

    // Create the reset URL
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`
    console.log("Reset URL:", resetUrl) // Debug log

    // Send the reset email
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text: `You have requested to reset your password. Please click this link to reset your password: ${resetUrl}`,
      html: `
        <div>
          <h1>Reset Your Password</h1>
          <p>You are receiving this email because an administrator has requested a password reset for your account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this password reset, you can ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

