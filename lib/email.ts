import nodemailer from "nodemailer"
import { getAppUrl } from "./get-app-url"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const { EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM } = process.env

  // Log the environment variables (without sensitive info)
  console.log("Email configuration:", {
    host: EMAIL_SERVER_HOST,
    port: EMAIL_SERVER_PORT,
    user: EMAIL_SERVER_USER ? "Set" : "Not set",
    password: EMAIL_SERVER_PASSWORD ? "Set" : "Not set",
    from: EMAIL_FROM,
  })

  // Get the app URL for links
  const appUrl = getAppUrl()
  console.log("App URL for email links:", appUrl)

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: EMAIL_SERVER_HOST,
    port: Number(EMAIL_SERVER_PORT),
    secure: Number(EMAIL_SERVER_PORT) === 465,
    auth: {
      user: EMAIL_SERVER_USER,
      pass: EMAIL_SERVER_PASSWORD,
    },
  })

  // Replace any placeholder URLs with the actual app URL
  const processedHtml = html.replace(/\{APP_URL\}/g, appUrl)
  const processedText = text.replace(/\{APP_URL\}/g, appUrl)

  // Send the email
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text: processedText,
    html: processedHtml,
  })

  console.log("Email sent:", info.messageId)
  return info
}

