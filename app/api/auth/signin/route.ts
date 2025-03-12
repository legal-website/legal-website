import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth-service"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if email is verified (skip in development)
    if (!user.emailVerified && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Email not verified. Please check your email for verification link." },
        { status: 401 },
      )
    }

    // Check password
    const isPasswordValid = await verifyPassword(user.password, password)
    if (!isPasswordValid) {
      console.log("Password verification failed for:", email)
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

    // Set session cookie - using the synchronous cookies() function
    // In newer versions of Next.js, cookies() is not a Promise, so we don't need to await it
    const cookieStore = cookies()
    cookieStore.set("session_token", session.token, {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

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

