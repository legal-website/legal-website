import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendVerificationEmail } from "@/lib/auth-service"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }

    // Send verification email
    await sendVerificationEmail(user.id, email)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error resending verification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

