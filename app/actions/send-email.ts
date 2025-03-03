"use server"

import nodemailer from "nodemailer"

export async function sendEmail(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  // Validate input
  if (!name || !email || !subject || !message) {
    return { success: false, message: "All fields are required." }
  }

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "ary5054@gmail.com", // Your email address
    subject: `New Contact Form Submission: ${subject}`,
    text: `
      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      Message: ${message}
    `,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  }

  try {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email configuration is missing.")
    }

    // Send email
    await transporter.sendMail(mailOptions)
    return { success: true, message: "Message sent successfully!" }
  } catch (error) {
    console.error("Error sending email:", error)

    // Provide more detailed error messages
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        return {
          success: false,
          message: "Failed to authenticate with the email server. Please check your email credentials.",
        }
      } else if (error.message.includes("configuration is missing")) {
        return {
          success: false,
          message: "Email service is not configured properly. Please contact the administrator.",
        }
      }
    }

    return { success: false, message: "Failed to send message. Please try again later or contact us directly." }
  }
}

