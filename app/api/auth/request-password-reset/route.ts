import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { getAppUrl } from "@/lib/get-app-url"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({ success: true })
    }

    // Generate a secure token
    const token = randomBytes(32).toString("hex")

    // Store the token in the database
    // This will serve as our record of when the password reset was requested
    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userId: user.id, // Connect to the user
      },
    })

    // Remove the lastPasswordChange update since it doesn't exist in the schema
    // Instead, we'll track password reset requests using the verificationToken

    // Get the app URL with a fallback to the Vercel deployment URL
    const appUrl = getAppUrl() || "https://orizeninc.com"

    // Create reset password URL
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    // Send the email
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

    if (!emailResult.success) {
      console.error("Failed to send reset password email:", emailResult.error)
      return NextResponse.json({ error: "Failed to send reset password email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

