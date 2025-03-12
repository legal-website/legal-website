import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-service"
import { Role } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const { name, email, password, invoiceId } = await req.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    try {
      // Use the registerUser function from auth-service
      const user = await registerUser(email, password, name, Role.CLIENT)

      // If we have an invoice ID, update the invoice with the user ID
      if (invoiceId) {
        const { db } = await import("@/lib/db")
        await db.invoice.update({
          where: { id: invoiceId },
          data: {
            userId: user.id,
          },
        })
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (error: any) {
      console.error("Error in registerUser:", error)
      return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      {
        error: "Failed to register user",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

