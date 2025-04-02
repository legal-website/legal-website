"use server"

import nodemailer from "nodemailer"

export async function sendEmail(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  console.log("Attempting to send email with the following details:")
  console.log(`Name: ${name}`)
  console.log(`Email: ${email}`)
  console.log(`Subject: ${subject}`)
  console.log(`Message: ${message?.substring(0, 50)}...`) // Log first 50 characters of the message

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS environment variables are not set")
    return { success: false, message: "Email configuration is missing. Please contact the administrator." }
  }

  console.log(`Using email: ${process.env.EMAIL_USER}`)

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "t4tech2011@gmail.com",
    subject: `New Contact Form Submission: ${subject}`,
    text: `
      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      Message: ${message}
    `,
    html: `
      <h3>New Contact Form Submission from contact us Page</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  }

  try {
    console.log("Attempting to send email...")
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.response)
    return { success: true, message: "Message sent successfully!" }
  } catch (error) {
    console.error("Error sending email:", error)
    if (error instanceof Error) {
      return {
        success: false,
        message: `Failed to send email: ${error.message}. Please try again later or contact us directly.`,
      }
    }
    return { success: false, message: "An unknown error occurred. Please try again later or contact us directly." }
  }
}

// Function specifically for sending invoice emails
export async function sendInvoiceEmail(invoiceId: string, customerEmail: string, invoiceNumber: string) {
  console.log(`Sending invoice ${invoiceNumber} to ${customerEmail}`)

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
    to: customerEmail,
    subject: `Your Invoice #${invoiceNumber}`,
    text: `
      Dear Customer,

      Please find attached your invoice #${invoiceNumber}.

      Thank you for your business.

      Regards,
      The Orizen Team
    `,
    html: `
      <h3>Your Invoice #${invoiceNumber}</h3>
      <p>Dear Customer,</p>
      <p>Please find attached your invoice #${invoiceNumber}.</p>
      <p>Thank you for your business.</p>
      <p>Regards,<br>The Orizen Team</p>
    `,
  }

  try {
    console.log("Attempting to send invoice email...")
    const info = await transporter.sendMail(mailOptions)
    console.log("Invoice email sent successfully:", info.response)
    return { success: true, message: "Invoice sent successfully!" }
  } catch (error) {
    console.error("Error sending invoice email:", error)
    if (error instanceof Error) {
      return {
        success: false,
        message: `Failed to send invoice: ${error.message}. Please try again later.`,
      }
    }
    return { success: false, message: "An unknown error occurred. Please try again later." }
  }
}

