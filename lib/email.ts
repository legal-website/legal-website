import nodemailer from "nodemailer"

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

// Export the function with the name that's being imported in other files
export const sendEmail = async (data: EmailPayload) => {
  const { to, subject, html, text } = data

  try {
    console.log("Sending email to:", to)
    console.log("Email configuration:", {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
      user: process.env.EMAIL_SERVER_USER ? "Set" : "Not set",
      from: process.env.EMAIL_FROM,
    })

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    })

    console.log("Email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

// Also export as sendMail for backward compatibility
export const sendMail = sendEmail

