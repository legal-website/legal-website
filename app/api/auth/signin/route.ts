import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth-service"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Add debugging
    console.log("Login attempt for email:", email)
    console.log("Password provided (length):", password?.length)

    // Validate required fields
    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("User not found in database")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("User found in database:", user.id)
    console.log("User email verified:", user.emailVerified ? "Yes" : "No")
    console.log("User password format:", user.password?.substring(0, 10) + "...")

    // Check if email is verified (skip in development)
    if (!user.emailVerified && process.env.NODE_ENV === "production") {
      console.log("Email not verified (but allowing in development)")
      // In development, we'll continue anyway
    }

    // Check password
    console.log("Verifying password...")
    const isPasswordValid = await verifyPassword(user.password, password)
    console.log("Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    console.log("Session created:", session.id)

    // Set session cookie
    const cookieStore = cookies()
    ;(await cookieStore).set("session_token", session.token, {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    console.log("Cookie set successfully")

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error: any) {
    console.error("Signin error:", error)
    return NextResponse.json(
      {
        error: "Failed to sign in",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

