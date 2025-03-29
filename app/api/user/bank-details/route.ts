import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

// Define the schema for validation
const bankDetailsSchema = z.object({
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(1, { message: "Account number is required" }),
  routingNumber: z.string().min(1, { message: "Routing number is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),
  swiftCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
})

// Default bank details to use when no records exist
const defaultBankDetails = {
  id: "default",
  accountName: "ORIZEN INC",
  accountNumber: "08751010024993",
  routingNumber: "PK51ALFH0875001010024993",
  bankName: "Bank Alfalah",
  accountType: "checking",
  swiftCode: "ALFHPKKAXXX",
  branchName: "EME DHA Br.LHR",
  branchCode: "0875",
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// GET handler to fetch bank details (for both admin and client)
export async function GET(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
      // Fetch the default bank account (the one admin has set up)
      const bankDetails = await db.bankAccount.findFirst({
        where: {
          isDefault: true,
        },
      })

      // If no bank details found, return default ORIZEN INC details
      if (!bankDetails) {
        return NextResponse.json({
          bankDetails: defaultBankDetails,
        })
      }

      return NextResponse.json({ bankDetails })
    } catch (error) {
      console.error("Database error:", error)
      // If there's a database error (like missing columns), return default details
      return NextResponse.json({
        bankDetails: defaultBankDetails,
      })
    }
  } catch (error) {
    console.error("Error fetching bank details:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch bank details",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

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

    try {
      // If this is set as default, unset any existing default
      if (data.isDefault) {
        try {
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
        } catch (error) {
          console.error("Error updating existing default accounts:", error)
          // Continue with the creation even if this fails
        }
      }

      // Create new bank details with only the fields that exist in the database
      const createData: any = {
        accountName: validatedData.accountName,
        accountNumber: validatedData.accountNumber,
        routingNumber: validatedData.routingNumber,
        bankName: validatedData.bankName,
        accountType: validatedData.accountType,
        createdBy: userId,
        isDefault: data.isDefault || false,
      }

      // Add optional fields if they exist
      if (validatedData.swiftCode) createData.swiftCode = validatedData.swiftCode
      if (validatedData.branchName) createData.branchName = validatedData.branchName
      if (validatedData.branchCode) createData.branchCode = validatedData.branchCode

      try {
        // Try to create with all fields
        const bankDetails = await db.bankAccount.create({
          data: createData,
        })

        return NextResponse.json({ bankDetails }, { status: 201 })
      } catch (error) {
        // If there's a Prisma error about unknown fields, try to determine which fields are causing issues
        if (error instanceof PrismaClientKnownRequestError) {
          console.error("Prisma error:", error.message)

          // Remove potentially problematic fields and try again
          delete createData.swiftCode
          delete createData.branchName
          delete createData.branchCode

          const bankDetails = await db.bankAccount.create({
            data: createData,
          })

          return NextResponse.json({ bankDetails }, { status: 201 })
        }

        throw error
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        {
          message: "Database error",
          error: String(dbError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error creating bank details:", error)
    return NextResponse.json(
      {
        message: "Failed to create bank details",
        error: String(error),
      },
      { status: 500 },
    )
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
      try {
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
      } catch (error) {
        console.error("Error updating existing default accounts:", error)
        // Continue with the update even if this fails
      }
    }

    // Prepare update data
    const updateData: any = {
      accountName: validatedData.accountName,
      accountNumber: validatedData.accountNumber,
      routingNumber: validatedData.routingNumber,
      bankName: validatedData.bankName,
      accountType: validatedData.accountType,
      isDefault: data.isDefault || false,
    }

    // Add optional fields if they exist
    if ("swiftCode" in data) updateData.swiftCode = data.swiftCode || null
    if ("branchName" in data) updateData.branchName = data.branchName || null
    if ("branchCode" in data) updateData.branchCode = data.branchCode || null

    try {
      // Update bank details
      const bankDetails = await db.bankAccount.update({
        where: { id: bankId },
        data: updateData,
      })

      return NextResponse.json({ bankDetails })
    } catch (error) {
      // If there's a Prisma error about unknown fields, try to determine which fields are causing issues
      if (error instanceof PrismaClientKnownRequestError) {
        console.error("Prisma error:", error.message)

        // Remove potentially problematic fields and try again
        delete updateData.swiftCode
        delete updateData.branchName
        delete updateData.branchCode

        const bankDetails = await db.bankAccount.update({
          where: { id: bankId },
          data: updateData,
        })

        return NextResponse.json({ bankDetails })
      }

      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    console.error("Error updating bank details:", error)
    return NextResponse.json(
      {
        message: "Failed to update bank details",
        error: String(error),
      },
      { status: 500 },
    )
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
    return NextResponse.json(
      {
        message: "Failed to delete bank details",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

