import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Validate admin session
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
      return NextResponse.json({ message: "Only administrators can access bank accounts" }, { status: 403 })
    }

    // Fetch bank account - use type assertion to fix TypeScript error
    const bankAccount = await (db.bankAccount as any).findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!bankAccount) {
      return NextResponse.json({ message: "Bank account not found" }, { status: 404 })
    }

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error("Error fetching bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch bank account",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Validate admin session
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
      return NextResponse.json({ message: "Only administrators can update bank accounts" }, { status: 403 })
    }

    const data = await req.json()

    // Check if bank account exists
    const existingAccount = await db.bankAccount.findUnique({
      where: { id },
    })

    if (!existingAccount) {
      return NextResponse.json({ message: "Bank account not found" }, { status: 404 })
    }

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      try {
        const currentDefaultAccounts = await db.bankAccount.findMany({
          where: {
            isDefault: true,
            id: { not: id },
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

    // Update bank account
    const updateData: any = {
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      bankName: data.bankName,
      accountType: data.accountType,
      isDefault: data.isDefault || false,
    }

    // Add optional fields if they exist
    if ("swiftCode" in data) updateData.swiftCode = data.swiftCode || null
    if ("branchName" in data) updateData.branchName = data.branchName || null
    if ("branchCode" in data) updateData.branchCode = data.branchCode || null

    try {
      const bankAccount = await db.bankAccount.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ bankAccount })
    } catch (error) {
      console.error("Error updating bank account:", error)

      // Try without optional fields if there's an error
      delete updateData.swiftCode
      delete updateData.branchName
      delete updateData.branchCode

      const bankAccount = await db.bankAccount.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ bankAccount })
    }
  } catch (error) {
    console.error("Error updating bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to update bank account",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Validate admin session
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
      return NextResponse.json({ message: "Only administrators can delete bank accounts" }, { status: 403 })
    }

    // Check if bank account exists
    const existingAccount = await db.bankAccount.findUnique({
      where: { id },
    })

    if (!existingAccount) {
      return NextResponse.json({ message: "Bank account not found" }, { status: 404 })
    }

    // Delete bank account
    await db.bankAccount.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Bank account deleted successfully" })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to delete bank account",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

