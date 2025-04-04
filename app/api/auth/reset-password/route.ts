import { type NextRequest, NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth-service"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Use the auth service to reset the password
    try {
      const user = await resetPassword(token, password)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

