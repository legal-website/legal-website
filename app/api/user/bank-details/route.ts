import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get bank accounts for the user
    const bankAccounts = await db.bankAccount.findMany({
      where: {
        createdBy: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      bankAccounts,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch bank accounts",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const data = await req.json()

    // Validate required fields
    const requiredFields = ["accountName", "accountNumber", "routingNumber", "bankName", "accountType"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          {
            message: `Missing required field: ${field}`,
            success: false,
          },
          { status: 400 },
        )
      }
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
          success: false,
        },
        { status: 404 },
      )
    }

    // If isDefault is true, update all other accounts to not be default
    if (data.isDefault) {
      // Get all default accounts
      const defaultAccounts = await db.bankAccount.findMany({
        where: {
          createdBy: userId,
          isDefault: true,
        },
      })

      // Update each one individually
      for (const account of defaultAccounts) {
        await db.bankAccount.update({
          where: { id: account.id },
          data: { isDefault: false },
        })
      }
    }

    // Create new bank account
    const bankAccount = await db.bankAccount.create({
      data: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        routingNumber: data.routingNumber,
        bankName: data.bankName,
        accountType: data.accountType,
        swiftCode: data.swiftCode || null,
        branchName: data.branchName || null,
        branchCode: data.branchCode || null,
        isDefault: data.isDefault || false,
        createdBy: userId,
        // Remove userId field as it's not in the Prisma model
      },
    })

    return NextResponse.json({
      message: "Bank account created successfully",
      bankAccount,
      success: true,
    })
  } catch (error) {
    console.error("Error creating bank account:", error)

    // Check for specific Prisma errors
    const errorString = String(error)
    if (errorString.includes("Foreign key constraint")) {
      return NextResponse.json(
        {
          message: "Database error",
          error: errorString,
          details: "There was an issue with the user reference. Please try again or contact support.",
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        message: "Database error",
        error: errorString,
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const data = await req.json()

    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        {
          message: "Missing bank account ID",
          success: false,
        },
        { status: 400 },
      )
    }

    // Check if bank account exists and belongs to the user
    const existingAccount = await db.bankAccount.findFirst({
      where: {
        id: data.id,
        createdBy: userId,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        {
          message: "Bank account not found or you don't have permission to update it",
          success: false,
        },
        { status: 404 },
      )
    }

    // If isDefault is true, update all other accounts to not be default
    if (data.isDefault) {
      // Get all other default accounts
      const otherDefaultAccounts = await db.bankAccount.findMany({
        where: {
          createdBy: userId,
          isDefault: true,
          id: { not: data.id },
        },
      })

      // Update each one individually
      for (const account of otherDefaultAccounts) {
        await db.bankAccount.update({
          where: { id: account.id },
          data: { isDefault: false },
        })
      }
    }

    // Update bank account
    const updateData: any = {}

    // Only update fields that are provided
    if (data.accountName !== undefined) updateData.accountName = data.accountName
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber
    if (data.routingNumber !== undefined) updateData.routingNumber = data.routingNumber
    if (data.bankName !== undefined) updateData.bankName = data.bankName
    if (data.accountType !== undefined) updateData.accountType = data.accountType
    if (data.swiftCode !== undefined) updateData.swiftCode = data.swiftCode
    if (data.branchName !== undefined) updateData.branchName = data.branchName
    if (data.branchCode !== undefined) updateData.branchCode = data.branchCode
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const bankAccount = await db.bankAccount.update({
      where: {
        id: data.id,
      },
      data: updateData,
    })

    return NextResponse.json({
      message: "Bank account updated successfully",
      bankAccount,
      success: true,
    })
  } catch (error) {
    console.error("Error updating bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to update bank account",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get bank account ID from query params
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          message: "Missing bank account ID",
          success: false,
        },
        { status: 400 },
      )
    }

    // Check if bank account exists and belongs to the user
    const existingAccount = await db.bankAccount.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        {
          message: "Bank account not found or you don't have permission to delete it",
          success: false,
        },
        { status: 404 },
      )
    }

    // Delete bank account
    await db.bankAccount.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      message: "Bank account deleted successfully",
      success: true,
    })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to delete bank account",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

