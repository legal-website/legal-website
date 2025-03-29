import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

// Define the schema for validation
const paymentMethodSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET handler to fetch a specific payment method
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isValid, response } = await validateSession()

    if (!isValid) {
      return response
    }

    const id = params.id

    // Fetch payment method from database
    const paymentMethod = await db.paymentMethod.findUnique({
      where: { id },
    })

    if (!paymentMethod) {
      return NextResponse.json({ message: "Payment method not found" }, { status: 404 })
    }

    return NextResponse.json({ paymentMethod })
  } catch (error) {
    console.error("Error fetching payment method:", error)
    return NextResponse.json({ message: "Failed to fetch payment method" }, { status: 500 })
  }
}

// PUT handler to update a payment method
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isValid, response } = await validateSession()

    if (!isValid) {
      return response
    }

    const id = params.id
    const data = await req.json()

    // Validate the request body
    const validatedData = paymentMethodSchema.parse(data)

    // Check if payment method exists
    const existingMethod = await db.paymentMethod.findUnique({
      where: { id },
    })

    if (!existingMethod) {
      return NextResponse.json({ message: "Payment method not found" }, { status: 404 })
    }

    // Update payment method
    const paymentMethod = await db.paymentMethod.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ paymentMethod })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error updating payment method:", error)
    return NextResponse.json({ message: "Failed to update payment method" }, { status: 500 })
  }
}

// DELETE handler to remove a payment method
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isValid, response } = await validateSession()

    if (!isValid) {
      return response
    }

    const id = params.id

    // Check if payment method exists
    const existingMethod = await db.paymentMethod.findUnique({
      where: { id },
    })

    if (!existingMethod) {
      return NextResponse.json({ message: "Payment method not found" }, { status: 404 })
    }

    // Delete payment method
    await db.paymentMethod.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Payment method deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json({ message: "Failed to delete payment method" }, { status: 500 })
  }
}

