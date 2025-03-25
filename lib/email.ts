import nodemailer from "nodemailer"

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

// Login notification email payload
type LoginNotificationPayload = {
  email: string
  name: string
  ipAddress: string
  browser: string
  os: string
  location: string
  time: string
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

// Function to send login notification emails
export const sendLoginNotificationEmail = async (data: LoginNotificationPayload) => {
  const { email, name, ipAddress, browser, os, location, time } = data

  const formattedTime = new Date(time).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const subject = "New Login Detected on Your Account"

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Login Alert</h2>
      <p>Hello ${name},</p>
      <p>We detected a new login to your account with the following details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>Browser:</strong> ${browser}</p>
        <p><strong>Operating System:</strong> ${os}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>
      <p>If this was you, no action is needed.</p>
      <p>If you don't recognize this login, please secure your account immediately by changing your password and contacting support.</p>
      <p>Thank you,<br>The Support Team</p>
    </div>
  `

  const text = `
    New Login Alert
    
    Hello ${name},
    
    We detected a new login to your account with the following details:
    
    Time: ${formattedTime}
    IP Address: ${ipAddress}
    Browser: ${browser}
    Operating System: ${os}
    Location: ${location}
    
    If this was you, no action is needed.
    
    If you don't recognize this login, please secure your account immediately by changing your password and contacting support.
    
    Thank you,
    The Support Team
  `

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

