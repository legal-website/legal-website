import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import * as bcryptjs from "bcryptjs"
import { verifyPassword } from "@/lib/auth-service"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get stored password hash
    const storedHash = user.password

    // Test verification with our function
    const isValidWithOurFunction = await verifyPassword(storedHash, password || "")

    // Test verification directly with bcryptjs
    let isValidWithBcrypt = false
    try {
      isValidWithBcrypt = await bcryptjs.compare(password || "", storedHash)
    } catch (error) {
      console.error("Bcrypt compare error:", error)
    }

    // Test if the stored password is a valid bcrypt hash
    let isValidBcryptHash = false
    try {
      isValidBcryptHash =
        storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")
    } catch (error) {
      console.error("Hash format check error:", error)
    }

    // Create a new hash with the provided password
    let newHash = ""
    try {
      newHash = await bcryptjs.hash(password || "", 10)
    } catch (error) {
      console.error("Hash generation error:", error)
    }

    return NextResponse.json({
      userId: user.id,
      emailVerified: user.emailVerified ? "Yes" : "No",
      storedHashFormat: storedHash.substring(0, 10) + "...",
      isValidWithOurFunction,
      isValidWithBcrypt,
      isValidBcryptHash,
      newHashFormat: newHash.substring(0, 10) + "...",
      passwordProvided: password ? "Yes" : "No",
      passwordLength: password?.length || 0,
    })
  } catch (error: any) {
    console.error("Debug password error:", error)
    return NextResponse.json(
      {
        error: "Failed to debug password",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

