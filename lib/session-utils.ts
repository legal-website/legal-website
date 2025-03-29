import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"

export async function validateSession() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return {
        isValid: false,
        userId: null,
        response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      }
    }

    const userId = session.user.id

    if (!userId) {
      return {
        isValid: false,
        userId: null,
        response: NextResponse.json({ message: "User ID not found in session" }, { status: 401 }),
      }
    }

    return {
      isValid: true,
      userId,
      response: null,
    }
  } catch (error) {
    console.error("Session validation error:", error)
    return {
      isValid: false,
      userId: null,
      response: NextResponse.json({ message: "Authentication error" }, { status: 500 }),
    }
  }
}

