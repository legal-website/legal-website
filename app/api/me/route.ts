import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/auth-service"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const sessionToken = (await cookies()).get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await validateSession(sessionToken)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

