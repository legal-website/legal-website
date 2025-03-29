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

// GET handler to fetch bank details (for both admin and client)
export async function GET(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Fetch the default bank account (the one admin has set up)
    const bankDetails = await db.bankAccount.findFirst({
      where: {
        isDefault: true,
      },
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

// The following routes are for admin use only

// POST handler to create new bank details (admin only)
export async function POST(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Only administrators can create bank details" }, { status: 403 })
    }

    const data = await req.json()

    // Validate the request body
    const validatedData = bankDetailsSchema.parse(data)

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      const currentDefaultAccounts = await db.bankAccount.findMany({
        where: { isDefault: true },
      })

      // Update each account individually
      for (const account of currentDefaultAccounts) {
        await db.bankAccount.update({
          where: { id: account.id },
          data: { isDefault: false },
        })
      }
    }

    // Create new bank details
    const bankDetails = await db.bankAccount.create({
      data: {
        ...validatedData,
        createdBy: userId,
        isDefault: data.isDefault || false,
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

// PUT handler to update existing bank details (admin only)
export async function PUT(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Only administrators can update bank details" }, { status: 403 })
    }

    const data = await req.json()
    const bankId = data.id

    if (!bankId) {
      return NextResponse.json({ message: "Bank account ID is required" }, { status: 400 })
    }

    // Validate the request body
    const validatedData = bankDetailsSchema.parse(data)

    // Check if bank details exist
    const existingDetails = await db.bankAccount.findUnique({
      where: { id: bankId },
    })

    if (!existingDetails) {
      return NextResponse.json({ message: "Bank details not found" }, { status: 404 })
    }

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      const currentDefaultAccounts = await db.bankAccount.findMany({
        where: {
          isDefault: true,
          id: { not: bankId },
        },
      })

      // Update each account individually
      for (const account of currentDefaultAccounts) {
        await db.bankAccount.update({
          where: { id: account.id },
          data: { isDefault: false },
        })
      }
    }

    // Update bank details
    const bankDetails = await db.bankAccount.update({
      where: { id: bankId },
      data: {
        ...validatedData,
        isDefault: data.isDefault || false,
      },
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

// DELETE handler to remove bank details (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Only administrators can delete bank details" }, { status: 403 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Bank account ID is required" }, { status: 400 })
    }

    // Check if bank details exist
    const existingDetails = await db.bankAccount.findUnique({
      where: { id },
    })

    if (!existingDetails) {
      return NextResponse.json({ message: "Bank details not found" }, { status: 404 })
    }

    // Delete bank details
    await db.bankAccount.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Bank details deleted successfully" })
  } catch (error) {
    console.error("Error deleting bank details:", error)
    return NextResponse.json({ message: "Failed to delete bank details" }, { status: 500 })
  }
}

