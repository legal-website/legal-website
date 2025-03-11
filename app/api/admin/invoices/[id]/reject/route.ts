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

    // Update invoice status to cancelled
    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "cancelled",
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

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: invoice.customerEmail,
      subject: `Payment Rejected for Invoice ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff4444;">Payment Rejected</h1>
          <p>Dear ${invoice.customerName},</p>
          <p>Unfortunately, your payment for invoice ${invoice.invoiceNumber} has been rejected.</p>
          <p>This could be due to one of the following reasons:</p>
          <ul>
            <li>The payment receipt was unclear or unreadable</li>
            <li>The payment amount did not match the invoice total</li>
            <li>The payment reference information was missing</li>
          </ul>
          <p>Please contact our support team for more information and to arrange an alternative payment.</p>
          <p>Thank you for your understanding.</p>
          <p>Sincerely,<br>Your Company Team</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      invoice,
      message: "Payment rejected and email sent to customer",
    })
  } catch (error: any) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json(
      {
        error: "Failed to reject payment",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

