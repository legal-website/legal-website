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

  // Fetch the invoice data to include in the email body
  try {
    const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoiceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!invoiceResponse.ok) {
      throw new Error("Failed to fetch invoice details")
    }

    const invoiceData = await invoiceResponse.json()
    const invoice = invoiceData.invoice

    // Parse items and filter out any currency_info items
    let items = []
    try {
      items = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items || []
      // Filter out any items with tier containing "currency_info"
      items = items.filter((item: any) => 
        !(item.tier && item.tier.includes("currency_info"))
      )
    } catch (error) {
      console.error("Error parsing invoice items:", error)
      items = []
    }

    // Format the invoice items as HTML
    const itemsHtml = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${item.tier || item.name || "Product"}</td>
        <td style="padding: 10px; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('')

    let stateFeeHtml = "";
    if (items.some(item => item.stateFee)) {
      stateFeeHtml = `
        <tr>
          <td>State Filing Fee</td>
          <td style="text-align: right;">$${items.reduce((sum, item) => sum + (item.stateFee || 0), 0).toFixed(2)}</td>
        </tr>
      `;
    }

    // Create a nicely formatted email with all invoice details
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #22c984; }
          .content { padding: 20px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f8f9fa; text-align: left; padding: 10px; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>INVOICE</h1>
            <h2>#${invoiceNumber}</h2>
          </div>
          <div class="content">
            <p>Dear ${invoice.customerName},</p>
            <p>Thank you for your business. Please find your invoice details below:</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="background-color: ${invoice.status === 'cancelled' ? 'red' : 'inherit'}; color: white; padding: 2px 5px; border-radius: 3px;">${invoice.status.toUpperCase()}</span></p>
            </div>
            
            <h3>Order Summary</h3>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                ${stateFeeHtml}
                <tr class="total-row">
                  <td>Total</td>
                  <td style="text-align: right;">$${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="customer-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${invoice.customerName}</p>
              <p><strong>Email:</strong> ${invoice.customerEmail}</p>
              ${invoice.customerPhone ? `<p><strong>Phone:</strong> ${invoice.customerPhone}</p>` : ''}
              ${invoice.customerCompany ? `<p><strong>Company:</strong> ${invoice.customerCompany}</p>` : ''}
            </div>
            
            ${invoice.customerAddress ? `
            <div class="billing-address">
              <h3>Billing Address</h3>
              <p>${invoice.customerAddress}</p>
              <p>${invoice.customerCity}${invoice.customerState ? `, ${invoice.customerState}` : ""} ${invoice.customerZip || ''}</p>
              <p>${invoice.customerCountry || ''}</p>
            </div>
            ` : ''}
            
            <p>If you have any questions about this invoice, please contact our support team.</p>
            
            <p>Regards,<br>The Orizen Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Orizen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

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
      html: emailHtml,
    }

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