import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

// Store tokens temporarily (in a real app, these would be in a database)
const verificationTokens = new Map<string, { email: string; expires: Date }>()

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Generate verification token
    const token = uuidv4()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token (in a real app, save to database)
    verificationTokens.set(token, { email, expires })

    // Ensure we have the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.json(
        {
          error: "Server configuration error",
          message: "Application URL is not configured properly",
        },
        { status: 500 },
      )
    }

    // Generate verification link
    const verificationLink = `${appUrl}/verify-email?token=${token}`
    console.log("Generated verification link:", verificationLink)

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c984;">Verify Your Email</h1>
          <p>Thank you for registering! Please click the button below to verify your email address:</p>
          <p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Verify Email
            </a>
          </p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Sincerely,<br>Your Company Team</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    })
  } catch (error: any) {
    console.error("Error sending verification email:", error)
    return NextResponse.json(
      {
        error: "Failed to send verification email",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Check if token exists and is valid
    const verification = verificationTokens.get(token)
    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Check if token is expired
    if (verification.expires < new Date()) {
      verificationTokens.delete(token)
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    // Token is valid, return the email
    return NextResponse.json({
      success: true,
      email: verification.email,
    })
  } catch (error: any) {
    console.error("Error verifying email:", error)
    return NextResponse.json(
      {
        error: "Failed to verify email",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

