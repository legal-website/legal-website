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
      return NextResponse.json({ message: "Only administrators can create test bank accounts" }, { status: 403 })
    }

    // Get a random UUID for the bank account ID
    const uuidResult = await db.$queryRawUnsafe(`SELECT UUID() as uuid`)
    const uuid = Array.isArray(uuidResult) && uuidResult.length > 0 ? uuidResult[0].uuid : null

    if (!uuid) {
      return NextResponse.json(
        {
          message: "Failed to generate UUID",
          success: false,
        },
        { status: 500 },
      )
    }

    // Create a test bank account using direct SQL
    const result = await db.$executeRawUnsafe(`
      INSERT INTO BankAccount (
        id, 
        userId, 
        accountName, 
        accountNumber, 
        routingNumber, 
        bankName, 
        accountType, 
        swiftCode, 
        branchName, 
        branchCode, 
        isDefault, 
        createdBy, 
        createdAt, 
        updatedAt
      ) VALUES (
        '${uuid}', 
        '${userId}', 
        'Test Account', 
        '123456789', 
        '987654321', 
        'Test Bank', 
        'checking', 
        'TESTCODE', 
        'Test Branch', 
        'TEST123', 
        0, 
        '${userId}', 
        NOW(), 
        NOW()
      )
    `)

    return NextResponse.json({
      message: "Test bank account created successfully",
      uuid,
      result,
      success: true,
    })
  } catch (error) {
    console.error("Error creating test bank account:", error)
    return NextResponse.json(
      {
        message: "Failed to create test bank account",
        error: String(error),
        success: false,
      },
      { status: 500 },
    )
  }
}

