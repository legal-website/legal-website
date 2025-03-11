import { type NextRequest, NextResponse } from "next/server"
import { requestPasswordReset } from "@/lib/auth-service"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await requestPasswordReset(email)

    // Always return success even if the email doesn't exist (for security)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

