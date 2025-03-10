import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-service"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, businessId, invoiceId } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // If invoiceId is provided, verify the invoice
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice) {
        return NextResponse.json({ error: "Invalid invoice" }, { status: 400 })
      }

      if (invoice.customerEmail !== email) {
        return NextResponse.json({ error: "Email does not match invoice record" }, { status: 400 })
      }
    }

    const user = await registerUser(email, password, name, role, businessId)

    // If invoiceId is provided, link the invoice to the user
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { userId: user.id },
      })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

