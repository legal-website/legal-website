import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { validateSession } from "@/lib/auth-service"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await validateSession(sessionToken)

    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

