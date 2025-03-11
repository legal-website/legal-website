import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { logoutUser } from "@/lib/auth-service"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: true }) // Already logged out
    }

    await logoutUser(sessionToken)

    // Clear the session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete("session_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

