import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate reset token
    const resetToken = uuidv4()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store the token in the VerificationToken model
    // Include the user relation since it's required
    await db.verificationToken.create({
      data: {
        token: resetToken,
        identifier: `reset-${user.email}`,
        expires,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Send email with reset link
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name || user.email},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Regards,<br>The Support Team</p>
        </div>
      `,
    })

    // Log the activity
    console.log(`Password reset requested for user ${userId} by admin ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error: any) {
    console.error("Error sending password reset:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while sending password reset",
      },
      { status: 500 },
    )
  }
}

