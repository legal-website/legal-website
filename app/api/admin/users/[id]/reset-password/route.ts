import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"
import { getAppUrl } from "@/lib/get-app-url"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Get user details
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

    // Get the app URL
    const appUrl = getAppUrl() || "https://legal-website-five.vercel.app"

    // Create reset password URL
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    // Send the email
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text: `Your password has been reset by an administrator. Please click this link to set a new password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c984;">Reset Your Password</h1>
          <p>Hello ${user.name || "there"},</p>
          <p>An administrator has requested to reset your password.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    })

    // Create a notification for the admin panel
    const notification = {
      title: "Password Reset Sent",
      description: `Password reset email sent to ${user.email}`,
      source: "password-reset",
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

