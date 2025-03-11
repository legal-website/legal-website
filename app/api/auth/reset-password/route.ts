import { type NextRequest, NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth-service"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    const user = await resetPassword(token, password)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

