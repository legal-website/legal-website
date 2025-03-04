import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create a transporter using Gmail's SMTP settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email address" }, { status: 400 })
    }

    // Additional validation (e.g., check for disposable email domains)
    const disposableDomains = ["tempmail.com", "throwawaymail.com"] // Add more as needed
    const emailDomain = email.split("@")[1]
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json(
        { success: false, message: "Please use a non-disposable email address" },
        { status: 400 },
      )
    }

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Use the Gmail address as the sender
      to: email,
      subject: "Newsletter Subscription Confirmation",
      text: "Thank you for subscribing to our newsletter!",
      html: "<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter!</p>",
    })

    // Here you would typically save the email to your database
    console.log(`Newsletter subscription: ${email}`)

    return NextResponse.json({ success: true, message: "Successfully subscribed to the newsletter" }, { status: 200 })
  } catch (error) {
    console.error("Newsletter subscription error:", error)

    return NextResponse.json({ success: false, message: "Failed to process subscription" }, { status: 500 })
  }
}

