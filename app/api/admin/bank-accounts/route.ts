import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
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

    // Get query parameters for pagination and filtering
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build the where clause for search
    const where = search
      ? {
          OR: [
            { accountName: { contains: search } },
            { accountNumber: { contains: search } },
            { bankName: { contains: search } },
          ],
        }
      : {}

    // Count total records for pagination - use type assertion to fix TypeScript error
    const totalCount = await (db.bankAccount as any).count({ where })

    // Fetch bank accounts with pagination
    const bankAccounts = await db.bankAccount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({
      bankAccounts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch bank accounts",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

// POST handler to create a new bank account (admin only)
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ message: "Only administrators can create bank accounts" }, { status: 403 })
    }

    const data = await req.json()

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

    // Create new bank account
    const createData: any = {
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      bankName: data.bankName,
      accountType: data.accountType,
      createdBy: userId,
      isDefault: data.isDefault || false,
    }

    // Add optional fields if they exist
    if (data.swiftCode) createData.swiftCode = data.swiftCode
    if (data.branchName) createData.branchName = data.branchName
    if (data.branchCode) createData.branchCode = data.branchCode

    try {
      const bankAccount = await db.bankAccount.create({
        data: createData,
      })

      return NextResponse.json({ bankAccount }, { status: 201 })
    } catch (error) {
      console.error("Error creating bank account:", error)

      // Try without optional fields if there's an error
      delete createData.swiftCode
      delete createData.branchName
      delete createData.branchCode

      const bankAccount = await db.bankAccount.create({
        data: createData,
      })

      return NextResponse.json({ bankAccount }, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to create bank account",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

// DELETE handler to delete multiple bank accounts (admin only)
export async function DELETE(req: NextRequest) {
  try {
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

    const data = await req.json()
    const ids = data.ids

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No bank account IDs provided" }, { status: 400 })
    }

    // Delete bank accounts one by one instead of using deleteMany
    let deletedCount = 0
    for (const id of ids) {
      try {
        await db.bankAccount.delete({
          where: { id },
        })
        deletedCount++
      } catch (error) {
        console.error(`Error deleting bank account ${id}:`, error)
      }
    }

    return NextResponse.json({
      message: `${deletedCount} bank accounts deleted successfully`,
      count: deletedCount,
    })
  } catch (error) {
    console.error("Error deleting bank accounts:", error)
    return NextResponse.json(
      {
        message: "Failed to delete bank accounts",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

