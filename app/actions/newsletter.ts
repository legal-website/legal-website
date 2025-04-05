"use server"

import nodemailer from "nodemailer"
import { newsletterSubscriptionTemplate } from "@/lib/email-templates"

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return {
      success: false,
      message: "Email is required",
    }
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS environment variables are not set")
    return { success: false, message: "Email configuration is missing. Please contact the administrator." }
  }

  try {
    // Here you would typically add the email to your newsletter database or service
    // For example, using a database query or an API call to a service like Mailchimp

    // For now, we'll just send a welcome email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Generate the HTML content using our template
    const htmlContent = newsletterSubscriptionTemplate(email)

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to the Orizen Newsletter!",
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: "You have been successfully subscribed to our newsletter!",
    }
  } catch (error) {
    console.error("Error subscribing to newsletter:", error)
    return {
      success: false,
      message: "Failed to subscribe. Please try again later.",
    }
  }
}

