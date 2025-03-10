import { NextResponse, type NextRequest } from "next/server"
import { verifyEmail } from "@/lib/auth-service"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const user = await verifyEmail(token)

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
  } catch (error: any) {
    console.error("Error verifying email:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

