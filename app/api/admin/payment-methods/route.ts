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

// GET handler to fetch payment methods
export async function GET(req: NextRequest) {
  try {
    const { isValid, response } = await validateSession()

    if (!isValid) {
      return response
    }

    // Fetch payment methods from database
    const paymentMethods = await db.paymentMethod.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ message: "Failed to fetch payment methods" }, { status: 500 })
  }
}

// POST handler to create new payment method
export async function POST(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid) {
      return response
    }

    const data = await req.json()

    // Validate the request body
    const validatedData = paymentMethodSchema.parse(data)

    // Create new payment method
    const paymentMethod = await db.paymentMethod.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
    })

    return NextResponse.json({ paymentMethod }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error creating payment method:", error)
    return NextResponse.json({ message: "Failed to create payment method" }, { status: 500 })
  }
}

