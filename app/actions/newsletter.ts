"use server"

import nodemailer from "nodemailer"

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get("email") as string

  console.log("Attempting to subscribe email:", email)

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS environment variables are not set")
    return { success: false, message: "Email configuration is missing. Please contact the administrator." }
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Newsletter Subscription Confirmation",
    text: "Thank you for subscribing to our newsletter!",
    html: "<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter!</p>",
  }

  try {
    console.log("Attempting to send confirmation email...")
    const info = await transporter.sendMail(mailOptions)
    console.log("Confirmation email sent successfully:", info.response)

    // Here you would typically save the email to your database
    console.log(`Newsletter subscription: ${email}`)

    return { success: true, message: "Successfully subscribed to the newsletter!" }
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    if (error instanceof Error) {
      return {
        success: false,
        message: `Failed to subscribe: ${error.message}. Please try again later.`,
      }
    }
    return { success: false, message: "An unknown error occurred. Please try again later." }
  }
}

