import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function GET() {
  try {
    const result = await sendEmail({
      to: "your-test-email@example.com", // Use your personal email for testing
      subject: "Email Migration Test",
      html: "<p>This is a test email to verify the new email configuration.</p>",
    })

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      details: result,
    })
  } catch (error) {
    console.error("Failed to send test email:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test email",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

