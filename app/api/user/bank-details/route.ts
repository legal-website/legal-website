import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

// Define the schema for validation
const bankDetailsSchema = z.object({
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(8, { message: "Valid account number is required" }),
  routingNumber: z.string().min(9, { message: "Valid routing number is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),
})

// GET handler to fetch user's bank details
export async function GET(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Fetch bank details from database
    const bankDetails = await db.bankAccount.findUnique({
      where: { userId },
    })

    // If no bank details found, return default ORIZEN INC details
    if (!bankDetails) {
      return NextResponse.json({
        bankDetails: {
          accountName: "ORIZEN INC",
          accountNumber: "08751010024993",
          routingNumber: "PK51ALFH0875001010024993", // Using IBAN as routing number
          bankName: "Bank Alfalah",
          accountType: "checking",
          swiftCode: "ALFHPKKAXXX",
          branchName: "EME DHA Br.LHR",
          branchCode: "0875",
        },
      })
    }

    return NextResponse.json({ bankDetails })
  } catch (error) {
    console.error("Error fetching bank details:", error)
    return NextResponse.json({ message: "Failed to fetch bank details" }, { status: 500 })
  }
}

// POST handler to create new bank details
export async function POST(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate the request body
    const validatedData = bankDetailsSchema.parse(data)

    // Check if user already has bank details
    const existingDetails = await db.bankAccount.findUnique({
      where: { userId },
    })

    if (existingDetails) {
      return NextResponse.json({ message: "Bank details already exist. Use PUT to update." }, { status: 400 })
    }

    // Create new bank details
    const bankDetails = await db.bankAccount.create({
      data: {
        userId,
        ...validatedData,
      },
    })

    return NextResponse.json({ bankDetails }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error creating bank details:", error)
    return NextResponse.json({ message: "Failed to create bank details" }, { status: 500 })
  }
}

// PUT handler to update existing bank details
export async function PUT(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate the request body
    const validatedData = bankDetailsSchema.parse(data)

    // Check if bank details exist
    const existingDetails = await db.bankAccount.findUnique({
      where: { userId },
    })

    if (!existingDetails) {
      return NextResponse.json({ message: "Bank details not found. Use POST to create." }, { status: 404 })
    }

    // Update bank details
    const bankDetails = await db.bankAccount.update({
      where: { userId },
      data: validatedData,
    })

    return NextResponse.json({ bankDetails })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error updating bank details:", error)
    return NextResponse.json({ message: "Failed to update bank details" }, { status: 500 })
  }
}

// DELETE handler to remove bank details
export async function DELETE(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if bank details exist
    const existingDetails = await db.bankAccount.findUnique({
      where: { userId },
    })

    if (!existingDetails) {
      return NextResponse.json({ message: "Bank details not found" }, { status: 404 })
    }

    // Delete bank details
    await db.bankAccount.delete({
      where: { userId },
    })

    return NextResponse.json({ message: "Bank details deleted successfully" })
  } catch (error) {
    console.error("Error deleting bank details:", error)
    return NextResponse.json({ message: "Failed to delete bank details" }, { status: 500 })
  }
}

