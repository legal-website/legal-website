import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

// Get all company bank accounts for clients to view
export async function GET(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response } = await validateSession()
    if (!isValid) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get all company bank accounts
    const bankAccounts = await db.bankAccount.findMany({
      orderBy: {
        isDefault: "desc", // Default accounts first, then others
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

// Admin only - add a new company bank account
export async function POST(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Only admins can add company bank accounts",
          success: false,
        },
        { status: 403 },
      )
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

    // If isDefault is true, update all other accounts to not be default
    if (data.isDefault) {
      // Get all default accounts
      const defaultAccounts = await db.bankAccount.findMany({
        where: {
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
      },
    })

    return NextResponse.json({
      message: "Bank account created successfully",
      bankAccount,
      success: true,
    })
  } catch (error) {
    console.error("Error creating bank account:", error)

    return NextResponse.json(
      {
        message: "Failed to create bank account",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

// Admin only - update a company bank account
export async function PUT(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Only admins can update company bank accounts",
          success: false,
        },
        { status: 403 },
      )
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

    // Check if bank account exists
    const existingAccount = await db.bankAccount.findUnique({
      where: {
        id: data.id,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        {
          message: "Bank account not found",
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

// Admin only - delete a company bank account
export async function DELETE(req: NextRequest) {
  try {
    // Validate session
    const { isValid, response, userId } = await validateSession()
    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Only admins can delete company bank accounts",
          success: false,
        },
        { status: 403 },
      )
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

    // Check if bank account exists
    const existingAccount = await db.bankAccount.findUnique({
      where: {
        id,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        {
          message: "Bank account not found",
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

