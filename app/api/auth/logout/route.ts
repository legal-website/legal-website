import { NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth-service"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const sessionToken = (await cookies()).get("session_token")?.value

    if (sessionToken) {
      await logoutUser(sessionToken)
    }

    // Clear the session cookie
    (await
          // Clear the session cookie
          cookies()).delete("session_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

