import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const invoiceId = params.id

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Update invoice status to paid
    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })

    // Send email notification to customer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Generate registration link
    const registrationLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?email=${encodeURIComponent(invoice.customerEmail)}`

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: invoice.customerEmail,
      subject: `Payment Approved for Invoice ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c984;">Payment Approved</h1>
          <p>Dear ${invoice.customerName},</p>
          <p>Your payment for invoice ${invoice.invoiceNumber} has been approved. Thank you for your purchase!</p>
          <p>You can now complete your registration by clicking the button below:</p>
          <p>
            <a href="${registrationLink}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Complete Registration
            </a>
          </p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you for your business!</p>
          <p>Sincerely,<br>Your Company Team</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      invoice,
      message: "Payment approved and email sent to customer",
    })
  } catch (error: any) {
    console.error("Error approving payment:", error)
    return NextResponse.json(
      {
        error: "Failed to approve payment",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

