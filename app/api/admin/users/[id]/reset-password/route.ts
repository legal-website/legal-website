import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"
import { getAppUrl } from "@/lib/get-app-url"
import { sendEmail } from "@/lib/email" // Use the correct import
import { randomBytes } from "crypto"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a secure token
    const token = randomBytes(32).toString("hex")

    // Store the token in the database
    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userId: user.id, // Connect to the user
      },
    })

    // Get the app URL with a fallback to the Vercel deployment URL
    const appUrl = getAppUrl() || "https://legal-website-five.vercel.app"

    // Create reset password URL
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    console.log("Sending reset password email to:", user.email)
    console.log("Reset URL:", resetUrl)

    // Send the email with detailed logging
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text: `You requested a password reset. Please click this link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c984;">Reset Your Password</h1>
          <p>Hello ${user.name || "there"},</p>
          <p>You (or someone else) requested to reset your password.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    console.log("Email sending result:", emailResult)

    if (!emailResult.success) {
      console.error("Failed to send reset password email:", emailResult.error)
      return NextResponse.json({ error: "Failed to send reset password email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password reset email sent" })
  } catch (error) {
    console.error("Error sending reset password email:", error)
    return NextResponse.json({ error: "Failed to send reset password email" }, { status: 500 })
  }
}

