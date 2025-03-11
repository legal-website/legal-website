import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { getAppUrl } from "@/lib/get-app-url"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { name, email, password, invoiceId } = await req.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with the correct role type
    // Using "CLIENT" role instead of "USER" since that's what's defined in the schema
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT", // Changed from "USER" to "CLIENT"
      },
    })

    // If we have an invoice ID, update the invoice with the user ID
    if (invoiceId) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          userId: user.id,
        },
      })
    }

    // Generate verification token
    const token = uuidv4()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token (in a real app, save to database)
    // For now, we'll skip this step since we're assuming the email is already verified
    // through the invoice process

    // Get the app URL
    const appUrl = getAppUrl()

    // Send welcome email
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
      subject: "Welcome to Our Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c984;">Welcome, ${name}!</h1>
          <p>Thank you for registering with us. Your account has been created successfully.</p>
          <p>You can now log in to access your account:</p>
          <p>
            <a href="${appUrl}/login" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Log In
            </a>
          </p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Sincerely,<br>Your Company Team</p>
        </div>
      `,
    })

    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      {
        error: "Failed to register user",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

