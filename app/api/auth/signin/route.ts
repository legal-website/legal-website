import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-service"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await loginUser(email, password)

    if (!result) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const { user, token } = result

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Return the user object (password is already removed in loginUser)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

